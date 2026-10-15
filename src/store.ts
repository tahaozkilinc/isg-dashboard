import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  Ayarlar, Egitim, IsgVeri, Kaza, Profil, Rol, Uygunsuzluk,
} from './types';
import { VARSAYILAN_AYARLAR } from './types';

export interface Durum {
  hazir: boolean; // oturum kontrolü tamamlandı mı
  kullanici: { id: string; eposta: string } | null;
  profil: Profil | null;
  veri: IsgVeri;
  veriYuklendi: boolean;
  profiller: Profil[]; // yalnızca admin için dolar
  hata: string | null;
}

function bosVeri(): IsgVeri {
  return { kazalar: [], uygunsuzluklar: [], egitimler: [], ayarlar: { ...VARSAYILAN_AYARLAR } };
}

function ilkDurum(): Durum {
  return { hazir: false, kullanici: null, profil: null, veri: bosVeri(), veriYuklendi: false, profiller: [], hata: null };
}

let durum: Durum = ilkDurum();
const dinleyiciler = new Set<() => void>();

function ayarla(kismi: Partial<Durum>) {
  durum = { ...durum, ...kismi };
  dinleyiciler.forEach((d) => d());
}

function veriGuncelle(f: (v: IsgVeri) => IsgVeri) {
  ayarla({ veri: f(durum.veri) });
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
  const rol = useDurum().profil?.rol;
  const yazabilir = rol === 'admin' || rol === 'uzman';
  return { rol, yazabilir, silebilir: rol === 'admin', admin: rol === 'admin' };
}

// ---------- Hata metinleri ----------

interface DbHata { code?: string; message?: string }

export function hataMetni(e: unknown): string {
  const h = (e ?? {}) as DbHata;
  const mesaj = h.message ?? '';
  if (h.code === '42501' || /row-level security|permission denied/i.test(mesaj)) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (/Invalid login credentials/i.test(mesaj)) return 'E-posta veya şifre hatalı.';
  if (/Email not confirmed/i.test(mesaj)) return 'E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzdaki bağlantıya tıklayın.';
  if (/User already registered/i.test(mesaj)) return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.';
  if (/Password should be at least/i.test(mesaj)) return 'Şifre en az 6 karakter olmalı.';
  if (/rate limit|too many/i.test(mesaj)) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
  if (/Failed to fetch|NetworkError|network/i.test(mesaj)) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  if (/son yönetici/i.test(mesaj)) return 'Sistemdeki son yönetici kaldırılamaz.';
  return mesaj || 'Beklenmeyen bir hata oluştu.';
}

function kontrol(sonuc: { error: unknown }) {
  if (sonuc.error) throw new Error(hataMetni(sonuc.error));
}

// ---------- Satır dönüştürücüler (veritabanı snake_case ⇄ uygulama camelCase) ----------

interface KazaSatir {
  id: string; tarih: string; ad_soyad: string; bolum: string; tur: Kaza['tur']; cesit: Kaza['cesit'];
  kok_sebep: string; yaralanma_bolgesi: Kaza['yaralanmaBolgesi']; kayip_gun: number; aciklama: string;
}
const kazaOku = (s: KazaSatir): Kaza => ({
  id: s.id, tarih: s.tarih, adSoyad: s.ad_soyad, bolum: s.bolum, tur: s.tur, cesit: s.cesit,
  kokSebep: s.kok_sebep, yaralanmaBolgesi: s.yaralanma_bolgesi, kayipGun: s.kayip_gun, aciklama: s.aciklama,
});
const kazaYaz = (k: Omit<Kaza, 'id'>) => ({
  tarih: k.tarih, ad_soyad: k.adSoyad, bolum: k.bolum, tur: k.tur, cesit: k.cesit,
  kok_sebep: k.kokSebep, yaralanma_bolgesi: k.yaralanmaBolgesi, kayip_gun: k.kayipGun, aciklama: k.aciklama,
});

interface UygSatir { id: string; tarih: string; baslik: string; kok_sebep: string; durum: Uygunsuzluk['durum'] }
const uygOku = (s: UygSatir): Uygunsuzluk => ({
  id: s.id, tarih: s.tarih, baslik: s.baslik, kokSebep: s.kok_sebep, durum: s.durum,
});

interface EgitimSatir { id: string; tarih: string; konu: string; katilimci: number }
const egitimOku = (s: EgitimSatir): Egitim => ({ id: s.id, tarih: s.tarih, konu: s.konu, katilimci: s.katilimci });

interface AyarSatir { firma_adi: string; calisan_sayisi: number; yillik_calisan_gun: number; gunluk_saat: number }
const ayarOku = (s: AyarSatir): Ayarlar => ({
  firmaAdi: s.firma_adi, calisanSayisi: s.calisan_sayisi,
  yillikCalisanGun: s.yillik_calisan_gun, gunlukSaat: Number(s.gunluk_saat),
});

interface ProfilSatir { id: string; eposta: string | null; ad_soyad: string; rol: Rol }
const profilOku = (s: ProfilSatir): Profil => ({
  id: s.id, eposta: s.eposta ?? '', adSoyad: s.ad_soyad, rol: s.rol,
});

// ---------- Veri yükleme ----------

async function verileriYukle() {
  const [k, u, e, a] = await Promise.all([
    supabase.from('isg_kazalar').select('*').order('tarih', { ascending: false }),
    supabase.from('isg_uygunsuzluklar').select('*').order('tarih', { ascending: false }),
    supabase.from('isg_egitimler').select('*').order('tarih', { ascending: false }),
    supabase.from('isg_ayarlar').select('*').eq('id', 1).maybeSingle(),
  ]);
  kontrol(k); kontrol(u); kontrol(e); kontrol(a);
  ayarla({
    veri: {
      kazalar: (k.data as KazaSatir[]).map(kazaOku),
      uygunsuzluklar: (u.data as UygSatir[]).map(uygOku),
      egitimler: (e.data as EgitimSatir[]).map(egitimOku),
      ayarlar: a.data ? ayarOku(a.data as AyarSatir) : { ...VARSAYILAN_AYARLAR },
    },
    veriYuklendi: true,
  });
}

async function profilleriYukle() {
  const r = await supabase.from('isg_profiller').select('*').order('olusturma', { ascending: true });
  kontrol(r);
  ayarla({ profiller: (r.data as ProfilSatir[]).map(profilOku) });
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
    ayarla({
      kullanici: { id: oturum.user.id, eposta: oturum.user.email ?? '' },
      hata: null,
    });
    const ad = (oturum.user.user_metadata?.ad_soyad as string | undefined) ?? '';
    const r = await supabase.rpc('isg_profil_olustur', { p_ad: ad });
    kontrol(r);
    const profil = profilOku(r.data as ProfilSatir);
    ayarla({ profil });
    if (profil.rol === 'admin' || profil.rol === 'uzman' || profil.rol === 'izleyici') {
      await verileriYukle();
      if (profil.rol === 'admin') await profilleriYukle();
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

/** true: hemen giriş yapıldı, false: e-posta doğrulaması gerekiyor. */
export async function kayitOl(eposta: string, sifre: string, adSoyad: string): Promise<boolean> {
  const r = await supabase.auth.signUp({
    email: eposta.trim(),
    password: sifre,
    options: { data: { ad_soyad: adSoyad.trim() } },
  });
  kontrol(r);
  return r.data.session !== null;
}

export async function cikisYap() {
  await supabase.auth.signOut();
}

export function hatayiTemizle() {
  ayarla({ hata: null });
}

// ---------- Veri işlemleri ----------

export const eylemler = {
  async kazaEkle(k: Omit<Kaza, 'id'>) {
    const r = await supabase.from('isg_kazalar').insert(kazaYaz(k)).select().single();
    kontrol(r);
    veriGuncelle((v) => ({ ...v, kazalar: [kazaOku(r.data as KazaSatir), ...v.kazalar] }));
  },
  async kazaSil(id: string) {
    kontrol(await supabase.from('isg_kazalar').delete().eq('id', id));
    veriGuncelle((v) => ({ ...v, kazalar: v.kazalar.filter((k) => k.id !== id) }));
  },
  async uygunsuzlukEkle(u: Omit<Uygunsuzluk, 'id' | 'durum'>) {
    const r = await supabase.from('isg_uygunsuzluklar')
      .insert({ tarih: u.tarih, baslik: u.baslik, kok_sebep: u.kokSebep })
      .select().single();
    kontrol(r);
    veriGuncelle((v) => ({ ...v, uygunsuzluklar: [uygOku(r.data as UygSatir), ...v.uygunsuzluklar] }));
  },
  async uygunsuzlukDurumDegistir(id: string) {
    const mevcut = durum.veri.uygunsuzluklar.find((u) => u.id === id);
    if (!mevcut) return;
    const yeni = mevcut.durum === 'AÇIK' ? 'KAPALI' : 'AÇIK';
    kontrol(await supabase.from('isg_uygunsuzluklar').update({ durum: yeni }).eq('id', id));
    veriGuncelle((v) => ({
      ...v, uygunsuzluklar: v.uygunsuzluklar.map((u) => (u.id === id ? { ...u, durum: yeni } : u)),
    }));
  },
  async uygunsuzlukSil(id: string) {
    kontrol(await supabase.from('isg_uygunsuzluklar').delete().eq('id', id));
    veriGuncelle((v) => ({ ...v, uygunsuzluklar: v.uygunsuzluklar.filter((u) => u.id !== id) }));
  },
  async egitimEkle(e: Omit<Egitim, 'id'>) {
    const r = await supabase.from('isg_egitimler').insert(e).select().single();
    kontrol(r);
    veriGuncelle((v) => ({ ...v, egitimler: [egitimOku(r.data as EgitimSatir), ...v.egitimler] }));
  },
  async egitimSil(id: string) {
    kontrol(await supabase.from('isg_egitimler').delete().eq('id', id));
    veriGuncelle((v) => ({ ...v, egitimler: v.egitimler.filter((e) => e.id !== id) }));
  },
  async ayarlarGuncelle(a: Ayarlar) {
    kontrol(await supabase.from('isg_ayarlar').update({
      firma_adi: a.firmaAdi, calisan_sayisi: a.calisanSayisi,
      yillik_calisan_gun: a.yillikCalisanGun, gunluk_saat: a.gunlukSaat,
    }).eq('id', 1));
    veriGuncelle((v) => ({ ...v, ayarlar: a }));
  },
  async rolDegistir(id: string, rol: Rol) {
    kontrol(await supabase.from('isg_profiller').update({ rol }).eq('id', id));
    ayarla({ profiller: durum.profiller.map((p) => (p.id === id ? { ...p, rol } : p)) });
  },
  async adDegistir(id: string, adSoyad: string) {
    kontrol(await supabase.from('isg_profiller').update({ ad_soyad: adSoyad }).eq('id', id));
    ayarla({ profiller: durum.profiller.map((p) => (p.id === id ? { ...p, adSoyad } : p)) });
  },
  profilleriYenile: profilleriYukle,
};
