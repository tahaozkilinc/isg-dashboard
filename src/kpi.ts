import type { IsgVeri, Kaza, KazaTuru } from './types';
import { KAZA_TURLERI, AYLAR } from './types';

// Excel'deki formüllerin birebir karşılığı:
//   Adam/Gün  = çalışan sayısı × yıllık çalışılan gün
//   Adam/Saat = Adam/Gün × günlük çalışma saati
//   Kaza Sıklık Hızı  = toplam kaza × 1.000.000 / Adam-Saat
//   Kaza Ağırlık Hızı = kayıp iş günü × 1.000 / Adam-Gün

export interface Donem {
  yil: number;
  ay: number | null; // null = tüm yıl
}

export function donemdeki(kazalar: Kaza[], d: Donem): Kaza[] {
  return kazalar.filter((k) => {
    const t = new Date(k.tarih);
    return t.getFullYear() === d.yil && (d.ay === null || t.getMonth() === d.ay);
  });
}

export function donemdekiKayitlar<T extends { tarih: string }>(kayitlar: T[], d: Donem): T[] {
  return kayitlar.filter((k) => {
    const t = new Date(k.tarih);
    return t.getFullYear() === d.yil && (d.ay === null || t.getMonth() === d.ay);
  });
}

export function ozet(veri: IsgVeri, d: Donem) {
  const kazalar = donemdeki(veri.kazalar, d);
  const uygunsuzluklar = donemdekiKayitlar(veri.uygunsuzluklar, d);
  const egitimler = donemdekiKayitlar(veri.egitimler, d);
  const { calisanSayisi, yillikCalisanGun, gunlukSaat } = veri.ayarlar;

  const turSayisi = (tur: KazaTuru) => kazalar.filter((k) => k.tur === tur).length;
  const kayipGun = kazalar.reduce((t, k) => t + (k.kayipGun || 0), 0);
  const adamGun = calisanSayisi * yillikCalisanGun;
  const adamSaat = adamGun * gunlukSaat;
  // Ay seçiliyken oranlar o ayın adam-saatine göre hesaplanır
  const oranBolen = d.ay === null ? 1 : 12;

  return {
    kazalar,
    uygunsuzluklar,
    egitimler,
    toplamKaza: kazalar.length,
    olumluKaza: turSayisi('Ölümlü Kaza'),
    gunKayipliKaza: turSayisi('İş Günü Kayıplı Kaza'),
    tibbiMudahaleli: turSayisi('Tıbbi Müdahaleli Kaza'),
    maddiHasarli: turSayisi('Maddi Hasarlı Kaza'),
    ilkYardim: turSayisi('İlk Yardım'),
    kisitliIsGorememezlik: turSayisi('Kısıtlı İş Görememezlik'),
    kayipGun,
    adamGun,
    adamSaat,
    siklikHizi: adamSaat > 0 ? (kazalar.length * 1_000_000) / (adamSaat / oranBolen) : 0,
    agirlikHizi: adamGun > 0 ? (kayipGun * 1_000) / (adamGun / oranBolen) : 0,
    acikUygunsuzluk: uygunsuzluklar.filter((u) => u.durum === 'AÇIK').length,
    kapaliUygunsuzluk: uygunsuzluklar.filter((u) => u.durum === 'KAPALI').length,
    egitimKonu: new Set(egitimler.map((e) => e.konu.trim().toLocaleLowerCase('tr'))).size,
    egitimKisi: egitimler.reduce((t, e) => t + (e.katilimci || 0), 0),
  };
}

export function sayim<T>(kayitlar: T[], anahtar: (k: T) => string): { ad: string; sayi: number }[] {
  const m = new Map<string, number>();
  for (const k of kayitlar) {
    const a = anahtar(k);
    if (!a) continue;
    m.set(a, (m.get(a) ?? 0) + 1);
  }
  return [...m.entries()].map(([ad, sayi]) => ({ ad, sayi })).sort((a, b) => b.sayi - a.sayi);
}

export function kazaTurDagilimi(kazalar: Kaza[]) {
  return KAZA_TURLERI.map((tur) => ({
    ad: tur,
    sayi: kazalar.filter((k) => k.tur === tur).length,
  })).filter((t) => t.sayi > 0);
}

export function aylikDagilim(kazalar: Kaza[], yil: number) {
  return AYLAR.map((ay, i) => ({
    ay,
    sayi: kazalar.filter((k) => {
      const t = new Date(k.tarih);
      return t.getFullYear() === yil && t.getMonth() === i;
    }).length,
  }));
}
