import { deger, GOSTERGE_HARITASI, sonVeriAyi } from './gostergeler';
import type { Veri } from './gostergeler';
import type { Degisiklik } from './store';

export type Yaka = 'mavi' | 'beyaz';
export type Cinsiyet = 'erkek' | 'kadin';

export interface YeniKaza {
  tarih: string; // YYYY-MM-DD
  yaka: Yaka;
  cinsiyet: Cinsiyet;
  engelli: boolean;
  kayipGun: number; // 0 = gün kayıpsız kaza
}

const GUN = 86_400_000;
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const ayinGunSayisi = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function tarihParcala(tarih: string): { yil: number; ay: number; gun: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tarih);
  if (!m) return null;
  const [yil, ay, gun] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ay < 1 || ay > 12 || gun < 1 || gun > ayinGunSayisi(yil, ay)) return null;
  return { yil, ay, gun };
}

export interface HesapSonucu {
  degisiklikler: Degisiklik[];
  /** Ekranda göstermek için: hangi gösterge, ay, eski ve yeni değer */
  ozet: { kod: string; ad: string; ay: number; once: number | null; sonra: number }[];
}

/**
 * Tek bir kazayı o ayın aylık göstergelerine işler.
 * Kaza sayıları ve kayıp günler artar; "ayda kazasız geçen gün" bir azalır;
 * "son kazadan sonra geçen gün" bu kazadan sonraki ayları kapsayacak şekilde yeniden hesaplanır.
 */
export function kazaHesapla(veri: Veri, k: YeniKaza): HesapSonucu | null {
  const t = tarihParcala(k.tarih);
  if (!t) return null;
  const { yil, ay, gun } = t;
  const sonuc = new Map<string, number>();
  const mevcut = (a: number, kod: string) => {
    const anahtar = `${a}|${kod}`;
    return sonuc.has(anahtar) ? sonuc.get(anahtar)! : deger(veri, yil, a, kod);
  };
  const yaz = (a: number, kod: string, v: number) => sonuc.set(`${a}|${kod}`, v);
  const artir = (kod: string, miktar: number) => yaz(ay, kod, (mevcut(ay, kod) ?? 0) + miktar);
  const sifirla = (kod: string) => { if (mevcut(ay, kod) === null) yaz(ay, kod, 0); };

  // Kaza sayıları: eksik hücreleri 0 yap ki ay "tamamlanmış" görünsün
  for (const kod of ['kaza_toplam', 'kaza_erkek', 'kaza_kadin', 'kaza_mavi', 'kaza_beyaz', 'kaza_engelli',
    'kaza_gun_kayipli', 'kaza_gun_kayipsiz', 'kayip_gun', 'kayip_gun_mavi', 'kayip_gun_beyaz']) sifirla(kod);

  artir('kaza_toplam', 1);
  artir(k.cinsiyet === 'erkek' ? 'kaza_erkek' : 'kaza_kadin', 1);
  artir(k.yaka === 'mavi' ? 'kaza_mavi' : 'kaza_beyaz', 1);
  if (k.engelli) artir('kaza_engelli', 1);
  artir(k.kayipGun > 0 ? 'kaza_gun_kayipli' : 'kaza_gun_kayipsiz', 1);
  if (k.kayipGun > 0) {
    artir('kayip_gun', k.kayipGun);
    artir(k.yaka === 'mavi' ? 'kayip_gun_mavi' : 'kayip_gun_beyaz', k.kayipGun);
  }

  // Ayda kazasız geçen gün: bu kaza bir gün daha eksiltir
  const mevcutKazasiz = deger(veri, yil, ay, 'yasanmayan_gun') ?? ayinGunSayisi(yil, ay);
  yaz(ay, 'yasanmayan_gun', Math.max(0, mevcutKazasiz - 1));

  // Son kazadan sonra geçen gün: bu kazadan sonraki (veri girilmiş) aylarda yeniden hesapla
  const kazaGunu = utc(yil, ay, gun);
  const sonAy = Math.max(ay, sonVeriAyi(veri, yil));
  for (let a = ay; a <= sonAy; a++) {
    const ayinSonu = utc(yil, a, ayinGunSayisi(yil, a));
    const v = mevcut(a, 'son_kazadan_gecen_gun');
    const yeniDeger = Math.round((ayinSonu - kazaGunu) / GUN);
    if (v === null) {
      if (a === ay) yaz(a, 'son_kazadan_gecen_gun', yeniDeger);
    } else {
      const eskiSonKaza = ayinSonu - v * GUN;
      if (kazaGunu > eskiSonKaza) yaz(a, 'son_kazadan_gecen_gun', yeniDeger);
    }
  }

  const degisiklikler: Degisiklik[] = [];
  const ozet: HesapSonucu['ozet'] = [];
  for (const [anahtar, sonra] of sonuc) {
    const [a, kod] = anahtar.split('|');
    const aNo = Number(a);
    const once = deger(veri, yil, aNo, kod);
    if (once === sonra) continue;
    degisiklikler.push({ yil, ay: aNo, kod, deger: sonra });
    ozet.push({ kod, ad: GOSTERGE_HARITASI[kod]?.ad ?? kod, ay: aNo, once, sonra });
  }
  return { degisiklikler, ozet };
}
