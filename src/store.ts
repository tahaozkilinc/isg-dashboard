import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Ayarlar, Kullanici, Rol } from './types';
import { anahtar } from './gostergeler';
import type { Veri } from './gostergeler';

export interface Durum {
  hazir: boolean; // oturum kontrolü tamamlandı mı
  oturum: { id: string; eposta: string } | null;
  /** Giriş yapılmış ama yönetici tarafından tanımlanmamışsa 'tanimsiz' */
  rol: Rol | 'tanimsiz' | null;
  adSoyad: string;
  ayarlar: Ayarlar;
  veri: Veri;
  veriYuklendi: boolean;
  kullanicilar: Kullanici[]; // yalnızca yönetici için dolar
  hata: string | null;
}

const VARSAYILAN_AYARLAR: Ayarlar = { firmaAdi: 'İSG Yönetim Sistemi' };

function ilkDurum(): Durum {
  return {
    hazir: false, oturum: null, rol: null, adSoyad: '', ayarlar: { ...VARSAYILAN_AYARLAR },
    veri: {}, veriYuklendi: false, kullanicilar: [], hata: null,
  };
}

let durum: Durum = ilkDurum();
const dinleyiciler = new Set<() => void>();

function ayarla(kismi: Partial<Durum>) {
  durum = { ...durum, ...kismi };
  dinleyiciler.forEach((d) => d());
}

export function useDurum(): Durum {
  return useSyncExternalStore(
    (cb) => {
      dinleyiciler.add(cb);
      return () => dinleyiciler.delete(cb);
    },
    () => durum,
  );
}

export function useYetki() {
  const { rol } = useDurum();
  return {
    rol,
    veriGirebilir: rol === 'uzman' || rol === 'admin_uzman', // veriyi İSG uzmanı girer
    tanimlayabilir: rol === 'admin' || rol === 'admin_uzman', // yönetici tanımlama yapar
  };
}

// ---------- Hata metinleri ----------

interface DbHata { code?: string; message?: string }

export function hataMetni(e: unknown): string {
  const h = (e ?? {}) as DbHata;
  const mesaj = h.message ?? '';
  if (h.code === '42501' || /row-level security|permission denied/i.test(mesaj)) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (/Could not find the (function|table)|schema cache|does not exist/i.test(mesaj)) {
    return 'Veritabanı henüz kurulmamış. Yönetici, supabase/migrations/20260115000000_isg_semasi.sql dosyasını Supabase SQL Editor\'de çalıştırmalı.';
  }
  if (/Invalid login credentials/i.test(mesaj)) return 'E-posta veya şifre hatalı.';
  if (/Email not confirmed/i.test(mesaj)) return 'E-posta adresiniz henüz doğrulanmamış. Yöneticiyle görüşün.';
  if (/rate limit|too many/i.test(mesaj)) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
  if (/Failed to fetch|NetworkError|network/i.test(mesaj)) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  if (/son yönetici/i.test(mesaj)) return 'Sistemdeki son yönetici kaldırılamaz.';
  if (/duplicate key|already exists/i.test(mesaj)) return 'Bu e-posta zaten tanımlı.';
  return mesaj || 'Beklenmeyen bir hata oluştu.';
}

function kontrol(sonuc: { error: unknown }) {
  if (sonuc.error) throw new Error(hataMetni(sonuc.error));
}

// ---------- Veri yükleme ----------

interface VeriSatiri { yil: number; ay: number; kod: string; deger: number | string }
interface KullaniciSatiri { eposta: string; ad_soyad: string; rol: Rol }

async function verileriYukle() {
  const [v, a] = await Promise.all([
    supabase.from('isg_aylik_veri').select('yil,ay,kod,deger').range(0, 9999),
    supabase.from('isg_ayarlar').select('firma_adi').eq('id', 1).maybeSingle(),
  ]);
  kontrol(v); kontrol(a);
  const veri: Veri = {};
  for (const s of v.data as VeriSatiri[]) veri[anahtar(s.yil, s.ay, s.kod)] = Number(s.deger);
  ayarla({
    veri,
    ayarlar: { firmaAdi: (a.data as { firma_adi: string } | null)?.firma_adi || VARSAYILAN_AYARLAR.firmaAdi },
    veriYuklendi: true,
  });
}

async function kullanicilariYukle() {
  const r = await supabase.from('isg_kullanicilar').select('eposta,ad_soyad,rol').order('olusturma', { ascending: true });
  kontrol(r);
  ayarla({
    kullanicilar: (r.data as KullaniciSatiri[]).map((k) => ({ eposta: k.eposta, adSoyad: k.ad_soyad, rol: k.rol })),
  });
}

// ---------- Oturum ----------

let islenenKullanici: string | null = null;

async function oturumuIsle(oturum: Session | null) {
  if (!oturum) {
    islenenKullanici = null;
    durum = { ...ilkDurum(), hazir: true };
    dinleyiciler.forEach((d) => d());
    return;
  }
  if (islenenKullanici === oturum.user.id && durum.hazir) return;
  islenenKullanici = oturum.user.id;
  try {
    ayarla({ oturum: { id: oturum.user.id, eposta: oturum.user.email ?? '' }, hata: null });
    const r = await supabase.rpc('isg_rolum');
    kontrol(r);
    const satir = (r.data as { o_eposta: string; o_ad_soyad: string; o_rol: Rol }[] | null)?.[0];
    if (!satir) {
      ayarla({ rol: 'tanimsiz' });
      return;
    }
    ayarla({ rol: satir.o_rol, adSoyad: satir.o_ad_soyad });
    if (satir.o_rol !== 'pasif') {
      await verileriYukle();
      if (satir.o_rol === 'admin' || satir.o_rol === 'admin_uzman') await kullanicilariYukle();
    }
  } catch (e) {
    ayarla({ hata: hataMetni(e) });
  } finally {
    ayarla({ hazir: true });
  }
}

let baslatildi = false;
export function oturumuBaslat() {
  if (baslatildi) return;
  baslatildi = true;
  // Geri çağrımın içinde başka Supabase isteği beklenmemeli; bu yüzden ertelenir.
  supabase.auth.onAuthStateChange((_olay, oturum) => {
    setTimeout(() => { void oturumuIsle(oturum); }, 0);
  });
}

export async function girisYap(eposta: string, sifre: string) {
  const r = await supabase.auth.signInWithPassword({ email: eposta.trim(), password: sifre });
  kontrol(r);
}

/** Kullanıcı kendi şifresini değiştirir; mevcut şifre yeniden doğrulanır. */
export async function sifreDegistir(mevcut: string, yeni: string) {
  const eposta = durum.oturum?.eposta;
  if (!eposta) throw new Error('Oturum bulunamadı.');
  const dogrula = await supabase.auth.signInWithPassword({ email: eposta, password: mevcut });
  if (dogrula.error) throw new Error('Mevcut şifre hatalı.');
  kontrol(await supabase.auth.updateUser({ password: yeni }));
}

export async function cikisYap() {
  await supabase.auth.signOut();
}

// ---------- Veri işlemleri ----------

export interface Degisiklik { yil: number; ay: number; kod: string; deger: number | null }

interface FonksiyonYaniti { tamam?: boolean; hata?: string }

/** Şifreli hesap açma/yenileme için Supabase Edge Function çağrısı (gizli anahtar sunucuda kalır). */
async function kullaniciIslevi(govde: Record<string, string>) {
  const r = await supabase.functions.invoke<FonksiyonYaniti>('kullanici-yonet', { body: govde });
  if (r.error) {
    const yanit = (r.error as { context?: Response }).context;
    if (yanit && typeof yanit.json === 'function') {
      const icerik = await yanit.json().catch(() => null) as FonksiyonYaniti | null;
      if (icerik?.hata) throw new Error(icerik.hata);
      if (yanit.status === 404) throw new Error('Kullanıcı oluşturma işlevi kurulmamış. README\'deki "Kullanıcı işlevi" adımını uygulayın.');
    }
    throw new Error(hataMetni(r.error));
  }
  if (r.data?.hata) throw new Error(r.data.hata);
}

export const eylemler = {
  /** Yönetici: ad + şifre ile yeni hesap açar ve rol tanımlar. */
  async kullaniciOlustur(k: Kullanici & { sifre: string }) {
    await kullaniciIslevi({ islem: 'olustur', eposta: k.eposta, adSoyad: k.adSoyad, rol: k.rol, sifre: k.sifre });
    await kullanicilariYukle();
  },
  /** Yönetici: bir kullanıcının şifresini yeniler. */
  async kullaniciSifreBelirle(eposta: string, sifre: string) {
    await kullaniciIslevi({ islem: 'sifre', eposta, sifre });
  },

  /** Uzman: değişen hücreleri kaydeder. deger = null → hücre silinir. */
  async veriKaydet(degisiklikler: Degisiklik[]) {
    const yazilacak = degisiklikler.filter((d) => d.deger !== null);
    const silinecek = degisiklikler.filter((d) => d.deger === null);
    if (yazilacak.length > 0) {
      const r = await supabase.from('isg_aylik_veri').upsert(
        yazilacak.map((d) => ({ yil: d.yil, ay: d.ay, kod: d.kod, deger: d.deger, guncelleme: new Date().toISOString() })),
        { onConflict: 'yil,ay,kod' },
      );
      kontrol(r);
    }
    for (const d of silinecek) {
      kontrol(await supabase.from('isg_aylik_veri').delete().eq('yil', d.yil).eq('ay', d.ay).eq('kod', d.kod));
    }
    const veri = { ...durum.veri };
    for (const d of degisiklikler) {
      const k = anahtar(d.yil, d.ay, d.kod);
      if (d.deger === null) delete veri[k]; else veri[k] = d.deger;
    }
    ayarla({ veri });
  },

  /** Yönetici: firma adı */
  async ayarlarGuncelle(a: Ayarlar) {
    kontrol(await supabase.from('isg_ayarlar').update({ firma_adi: a.firmaAdi }).eq('id', 1));
    ayarla({ ayarlar: a });
  },

  /** Yönetici: kullanıcı tanımı (hesap Supabase panelinde açılır, burada yalnızca rol verilir) */
  async kullaniciEkle(k: Kullanici) {
    kontrol(await supabase.from('isg_kullanicilar').insert({
      eposta: k.eposta.trim().toLowerCase(), ad_soyad: k.adSoyad.trim(), rol: k.rol,
    }));
    await kullanicilariYukle();
  },
  async kullaniciGuncelle(eposta: string, kismi: { adSoyad?: string; rol?: Rol }) {
    const guncel: Record<string, string> = {};
    if (kismi.adSoyad !== undefined) guncel.ad_soyad = kismi.adSoyad.trim();
    if (kismi.rol !== undefined) guncel.rol = kismi.rol;
    kontrol(await supabase.from('isg_kullanicilar').update(guncel).eq('eposta', eposta));
    await kullanicilariYukle();
  },
  async kullaniciSil(eposta: string) {
    kontrol(await supabase.from('isg_kullanicilar').delete().eq('eposta', eposta));
    await kullanicilariYukle();
  },
};
