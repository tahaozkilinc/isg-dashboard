// Excel'deki "Temel İş Güvenliği İstatistikleri" tablosunun göstergeleri.
// Her aylık değer veritabanında (yıl, ay, kod) olarak tutulur; ay = 0 geçmiş yılın toplamıdır.

export type Birlesim = 'toplam' | 'ortalama' | 'son' | 'yok';
export type Yon = 'dusuk-iyi' | 'yuksek-iyi' | 'notr';

export interface Gosterge {
  kod: string;
  ad: string;
  grup: string;
  birim?: string;
  /** Aylık değerlerden yıl değeri nasıl çıkar: toplam, ortalama, son ay ya da yalnızca yıllık girilir */
  birlesim: Birlesim;
  yon: Yon;
  ondalik?: number;
  ipucu?: string;
}

export const GRUPLAR = ['İş Kazaları', 'Risk ve İyileştirme', 'Denetim', 'Çalışma Hayatı', 'Eğitim'] as const;

export const GOSTERGELER: Gosterge[] = [
  { kod: 'kaza_toplam', ad: 'İş kazası sayısı', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_erkek', ad: 'Kaza geçiren erkek personel', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_kadin', ad: 'Kaza geçiren kadın personel', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_mavi', ad: 'Kaza geçiren mavi yaka', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_beyaz', ad: 'Kaza geçiren beyaz yaka', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_engelli', ad: 'Kaza geçiren engelli çalışan', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_gun_kayipli', ad: 'Gün kayıplı kaza', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kaza_gun_kayipsiz', ad: 'Gün kayıpsız kaza', grup: 'İş Kazaları', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kayip_gun', ad: 'İş kazası kayıp gün sayısı', grup: 'İş Kazaları', birim: 'gün', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kayip_gun_mavi', ad: 'Mavi yaka kayıp gün', grup: 'İş Kazaları', birim: 'gün', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'kayip_gun_beyaz', ad: 'Beyaz yaka kayıp gün', grup: 'İş Kazaları', birim: 'gün', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'meslek_hastaligi_kayip_gun', ad: 'Meslek hastalığı kayıp gün', grup: 'İş Kazaları', birim: 'gün', birlesim: 'toplam', yon: 'dusuk-iyi' },
  { kod: 'yasanmayan_gun', ad: 'Ayda kazasız geçen gün', grup: 'İş Kazaları', birim: 'gün', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'son_kazadan_gecen_gun', ad: 'Son kazadan sonra geçen gün', grup: 'İş Kazaları', birim: 'gün', birlesim: 'son', yon: 'yuksek-iyi', ipucu: 'Ay sonu itibarıyla' },
  { kod: 'siklik_orani', ad: 'Kümülatif sıklık oranı', grup: 'İş Kazaları', birlesim: 'yok', yon: 'dusuk-iyi', ondalik: 2, ipucu: 'Yıl sonunda hesaplanır' },
  { kod: 'agirlik_orani', ad: 'Kümülatif ağırlık oranı', grup: 'İş Kazaları', birlesim: 'yok', yon: 'dusuk-iyi', ondalik: 2, ipucu: 'Yıl sonunda hesaplanır' },

  { kod: 'ramak_kala', ad: 'Ramak kala ve risk bildirimi', grup: 'Risk ve İyileştirme', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'iyilestirme_gozlem', ad: 'İyileştirme gözlem adedi', grup: 'Risk ve İyileştirme', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'iyilestirme_faaliyet', ad: 'İyileştirme faaliyet adedi', grup: 'Risk ve İyileştirme', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'gunluk_isbasi_iyilestirme', ad: 'Günlük işbaşı iyileştirme adedi', grup: 'Risk ve İyileştirme', birlesim: 'toplam', yon: 'yuksek-iyi' },

  { kod: 'ic_denetim_puani', ad: 'İç denetim puanı', grup: 'Denetim', birim: 'puan', birlesim: 'ortalama', yon: 'yuksek-iyi', ondalik: 2 },
  { kod: 'gerceklesme_puani', ad: 'Gerçekleşme puanı', grup: 'Denetim', birim: '%', birlesim: 'ortalama', yon: 'yuksek-iyi', ondalik: 1 },

  { kod: 'is_izni', ad: 'İş izni sayısı', grup: 'Çalışma Hayatı', birlesim: 'toplam', yon: 'notr' },
  { kod: 'ise_giris', ad: 'İşe giriş sayısı', grup: 'Çalışma Hayatı', birlesim: 'toplam', yon: 'notr' },
  { kod: 'saglik_rapor_gun', ad: 'Sağlık raporu gün sayısı', grup: 'Çalışma Hayatı', birim: 'gün', birlesim: 'toplam', yon: 'dusuk-iyi' },

  { kod: 'ilk_ise_giris_egitim_saati', ad: 'İşe giriş eğitimi', grup: 'Eğitim', birim: 'saat', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'diger_egitim_katilimci', ad: 'Diğer eğitimler — katılımcı', grup: 'Eğitim', birim: 'kişi', birlesim: 'toplam', yon: 'yuksek-iyi' },
  { kod: 'diger_egitim_adam_saat', ad: 'Diğer eğitimler — adam·saat', grup: 'Eğitim', birim: 'saat', birlesim: 'toplam', yon: 'yuksek-iyi', ondalik: 1 },
];

export const GOSTERGE_HARITASI: Record<string, Gosterge> = Object.fromEntries(GOSTERGELER.map((g) => [g.kod, g]));

// ---------- Veri erişimi ----------

/** "yil|ay|kod" → değer */
export type Veri = Record<string, number>;

export const anahtar = (yil: number, ay: number, kod: string) => `${yil}|${ay}|${kod}`;

export function deger(veri: Veri, yil: number, ay: number, kod: string): number | null {
  const v = veri[anahtar(yil, ay, kod)];
  return v === undefined ? null : v;
}

export function aylikDegerler(veri: Veri, yil: number, kod: string): (number | null)[] {
  return Array.from({ length: 12 }, (_, i) => deger(veri, yil, i + 1, kod));
}

/** Verisi girilmiş en son ay (1–12); hiç veri yoksa 0 */
export function sonVeriAyi(veri: Veri, yil: number): number {
  let son = 0;
  for (const g of GOSTERGELER) {
    for (let a = 12; a > son; a--) {
      if (veri[anahtar(yil, a, g.kod)] !== undefined) { son = a; break; }
    }
  }
  return son;
}

export function yillar(veri: Veri): number[] {
  const s = new Set<number>();
  for (const k of Object.keys(veri)) s.add(Number(k.split('|')[0]));
  return [...s].sort((a, b) => b - a);
}

/** Bir göstergenin yıl değeri: aylıklardan hesaplanır, aylık yoksa yıllık (ay=0) değer kullanılır. */
export function yilDegeri(veri: Veri, yil: number, g: Gosterge): number | null {
  if (g.birlesim !== 'yok') {
    const aylar = aylikDegerler(veri, yil, g.kod).filter((v): v is number => v !== null);
    if (aylar.length > 0) {
      if (g.birlesim === 'toplam') return aylar.reduce((t, v) => t + v, 0);
      if (g.birlesim === 'ortalama') return aylar.reduce((t, v) => t + v, 0) / aylar.length;
      return aylar[aylar.length - 1];
    }
  }
  return deger(veri, yil, 0, g.kod);
}

/** Ay ay toplanabilen bir göstergenin, verisi olan aylardaki toplamı (yıl içi birikim) */
export function birikim(veri: Veri, yil: number, kod: string): number {
  return aylikDegerler(veri, yil, kod).reduce<number>((t, v) => t + (v ?? 0), 0);
}

// ---------- Karşılaştırma ----------

export type Durum = 'iyi' | 'kotu' | 'notr';

export interface Karsilastirma {
  oncekiYil: number;
  /** Karşılaştırma tabanı: toplam göstergelerde önceki yılın aynı süreye düşen payı, diğerlerinde önceki yıl değeri */
  taban: number;
  fark: number;
  yuzde: number | null;
  durum: Durum;
}

export function karsilastir(g: Gosterge, bu: number | null, onceki: number | null, oncekiYil: number, aySayisi: number): Karsilastirma | null {
  if (bu === null || onceki === null || aySayisi <= 0) return null;
  const taban = g.birlesim === 'toplam' ? (onceki / 12) * aySayisi : onceki;
  const fark = bu - taban;
  const yuzde = taban !== 0 ? (fark / taban) * 100 : null;
  const yakin = Math.abs(fark) < Math.max(Math.abs(taban) * 0.02, 0.0001);
  let durum: Durum = 'notr';
  if (!yakin && g.yon !== 'notr') {
    const artti = fark > 0;
    durum = (g.yon === 'dusuk-iyi') === !artti ? 'iyi' : 'kotu';
  }
  return { oncekiYil, taban, fark, yuzde, durum };
}

// ---------- Biçimlendirme ----------

const bicimleyiciler = new Map<number, Intl.NumberFormat>();
export function sayiYaz(v: number | null | undefined, ondalik = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  let f = bicimleyiciler.get(ondalik);
  if (!f) {
    f = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: ondalik });
    bicimleyiciler.set(ondalik, f);
  }
  return f.format(v);
}
