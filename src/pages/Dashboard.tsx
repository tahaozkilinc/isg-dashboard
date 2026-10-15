import { useMemo, useState } from 'react';
import { useDurum } from '../store';
import { tarihParcala } from '../tarih';
import { ozet, sayim, kazaTurDagilimi, aylikDagilim, donemdeki } from '../kpi';
import type { Donem } from '../kpi';
import { AYLAR, YARALANMA_BOLGELERI } from '../types';
import type { YaralanmaBolgesi } from '../types';
import { HalkaGrafik, YatayBar, AylikBar } from '../components/grafikler';
import { VucutHaritasi } from '../components/VucutHaritasi';

const SAYI_BICIMI = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

function Kpi({ deger, etiket, renk }: { deger: string | number; etiket: string; renk?: string }) {
  return (
    <div className="kpi" style={renk ? ({ '--kpi-renk': renk } as React.CSSProperties) : undefined}>
      <div className="deger">{typeof deger === 'number' ? SAYI_BICIMI.format(deger) : deger}</div>
      <div className="etiket">{etiket}</div>
    </div>
  );
}

export function Dashboard() {
  const { veri } = useDurum();
  const simdi = new Date();
  const [yil, setYil] = useState(simdi.getFullYear());
  const [ay, setAy] = useState<number | null>(null); // null = tüm yıl

  const o = useMemo(() => ozet(veri, { yil, ay } satisfies Donem), [veri, yil, ay]);

  const yillar = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear()]);
    veri.kazalar.forEach((k) => s.add(tarihParcala(k.tarih).yil));
    veri.uygunsuzluklar.forEach((u) => s.add(tarihParcala(u.tarih).yil));
    veri.egitimler.forEach((e) => s.add(tarihParcala(e.tarih).yil));
    return [...s].sort((a, b) => b - a);
  }, [veri]);

  const turDagilimi = kazaTurDagilimi(o.kazalar);
  const cesitDagilimi = sayim(o.kazalar, (k) => k.cesit);
  const kokSebepDagilimi = sayim(o.kazalar, (k) => k.kokSebep);
  const uygKokNeden = sayim(o.uygunsuzluklar, (u) => u.kokSebep);
  const aylik = aylikDagilim(veri.kazalar, yil);
  const yildakiKazalar = donemdeki(veri.kazalar, { yil, ay: null });

  const bolgeSayilari = new Map<YaralanmaBolgesi, number>();
  for (const b of YARALANMA_BOLGELERI) bolgeSayilari.set(b, 0);
  for (const k of o.kazalar) {
    if (k.yaralanmaBolgesi !== 'Yok / Uygulanmaz') {
      bolgeSayilari.set(k.yaralanmaBolgesi, (bolgeSayilari.get(k.yaralanmaBolgesi) ?? 0) + 1);
    }
  }

  const hicVeriYok = veri.kazalar.length === 0 && veri.uygunsuzluklar.length === 0 && veri.egitimler.length === 0;

  return (
    <div>
      <div className="dashboard-baslik">
        <h2>{ay === null ? `${yil} YILI` : `${yil} ${AYLAR[ay].toLocaleUpperCase('tr')}`} İSG KPI RAPORU</h2>
        <span className="alt" style={{ color: 'var(--muted)', fontSize: 12 }}>
          Rapor tarihi: {simdi.toLocaleDateString('tr-TR')}
        </span>
        <div className="donem-secim">
          <select className="kucuk" value={yil} onChange={(e) => setYil(Number(e.target.value))} aria-label="Yıl">
            {yillar.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            className="kucuk"
            value={ay === null ? 'tum' : ay}
            onChange={(e) => setAy(e.target.value === 'tum' ? null : Number(e.target.value))}
            aria-label="Ay"
          >
            <option value="tum">Tüm Yıl</option>
            {AYLAR.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
        </div>
      </div>

      {hicVeriYok ? (
        <div className="kart bos-durum">
          <p>Henüz kayıt yok. Kaza, uygunsuzluk ve eğitim kayıtları girildikçe dashboard otomatik dolacak.</p>
        </div>
      ) : (
        <>
          {/* Yönetici özeti — Excel'deki KPI blokları */}
          <div className="kpi-grid">
            <Kpi deger={o.toplamKaza} etiket="KAZA/OLAY SAYISI" renk="var(--s1)" />
            <Kpi deger={o.olumluKaza} etiket="ÖLÜMLÜ KAZA SAYISI" renk={o.olumluKaza > 0 ? 'var(--critical)' : 'var(--good)'} />
            <Kpi deger={o.gunKayipliKaza} etiket="GÜN KAYIPLI KAZA SAYISI" renk="var(--s8)" />
            <Kpi deger={o.kayipGun} etiket="KAYIP İŞ GÜNÜ SAYISI" renk="var(--s8)" />
            <Kpi deger={o.tibbiMudahaleli} etiket="TIBBİ MÜDAHALELİ KAZA" renk="var(--s5)" />
            <Kpi deger={o.maddiHasarli} etiket="MADDİ HASARLI KAZA" renk="var(--s3)" />
            <Kpi deger={SAYI_BICIMI.format(o.siklikHizi)} etiket="KAZA SIKLIK HIZI" renk="var(--s1)" />
            <Kpi deger={SAYI_BICIMI.format(o.agirlikHizi)} etiket="KAZA AĞIRLIK HIZI" renk="var(--s1)" />
            <Kpi deger={o.acikUygunsuzluk} etiket="AÇIK UYGUNSUZLUK" renk="var(--serious)" />
            <Kpi deger={o.kapaliUygunsuzluk} etiket="KAPALI UYGUNSUZLUK" renk="var(--good)" />
            <Kpi deger={o.egitimKonu} etiket="EĞİTİM KONU SAYISI" renk="var(--s2)" />
            <Kpi deger={o.egitimKisi} etiket="EĞİTİM ALAN KİŞİ SAYISI" renk="var(--s2)" />
          </div>

          <div className="grid-3">
            <div className="kart">
              <h3>Kaza/Olay Türleri</h3>
              <HalkaGrafik veri={turDagilimi} />
            </div>
            <div className="kart">
              <h3>Yaralanma Bölgesi</h3>
              <VucutHaritasi sayilar={bolgeSayilari} />
            </div>
            <div className="kart">
              <h3>Kaza/Olay Çeşidi</h3>
              <YatayBar veri={cesitDagilimi} />
            </div>
          </div>

          <div className="grid-2">
            <div className="kart">
              <h3>Kaza/Olay Kök Sebepleri</h3>
              <YatayBar veri={kokSebepDagilimi} renk="var(--s5)" />
            </div>
            <div className="kart">
              <h3>Aylara Göre Kaza/Olay Dağılımı — {yil} (Toplam: {yildakiKazalar.length})</h3>
              <AylikBar veri={aylik} />
            </div>
          </div>

          <div className="grid-2">
            <div className="kart">
              <h3>Uygunsuzluk İstatistikleri</h3>
              <HalkaGrafik
                veri={[
                  { ad: 'AÇIK', sayi: o.acikUygunsuzluk },
                  { ad: 'KAPALI', sayi: o.kapaliUygunsuzluk },
                ].filter((d) => d.sayi > 0)}
                renkSirasi={['#ec835a', '#0ca30c']}
              />
            </div>
            <div className="kart">
              <h3>Uygunsuzluk Kök Nedenleri</h3>
              <YatayBar veri={uygKokNeden} renk="var(--s8)" />
            </div>
          </div>

          <p className="bilgi-notu">
            Kaza Sıklık Hızı = kaza sayısı × 1.000.000 / adam-saat ({SAYI_BICIMI.format(o.adamSaat)}) ·
            Kaza Ağırlık Hızı = kayıp iş günü × 1.000 / adam-gün ({SAYI_BICIMI.format(o.adamGun)}) ·
            Parametreler "Ayarlar" sekmesinden değiştirilebilir.
          </p>
        </>
      )}
    </div>
  );
}
