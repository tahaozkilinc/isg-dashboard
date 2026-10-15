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

function Say({ deger, etiket, renk }: { deger: string | number; etiket: string; renk?: string }) {
  return (
    <div className="say" style={renk ? ({ '--say-renk': renk } as React.CSSProperties) : undefined}>
      <div className="say-deger">{typeof deger === 'number' ? SAYI_BICIMI.format(deger) : deger}</div>
      <div className="say-etiket">{etiket}</div>
    </div>
  );
}

function Grup({ baslik, children, sinif }: { baslik: string; children: React.ReactNode; sinif?: string }) {
  return (
    <section className={`grup ${sinif ?? ''}`}>
      <h3 className="grup-baslik">{baslik}</h3>
      <div className="grup-icerik">{children}</div>
    </section>
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

  const donemAdi = ay === null ? `${yil} YILI` : `${yil} ${AYLAR[ay].toLocaleUpperCase('tr')}`;
  const raporTarihi = ay !== null && new Date(yil, ay + 1, 0) < simdi ? new Date(yil, ay + 1, 0) : simdi;
  const firma = veri.ayarlar.firmaAdi;
  const basHarfler = firma.split(/\s+/).map((k) => k[0]).join('').slice(0, 2).toLocaleUpperCase('tr');

  return (
    <div className="rapor">
      <header className="rapor-baslik">
        <div className="rapor-firma">
          <div className="logo logo-buyuk" aria-hidden>{basHarfler}</div>
          <div>
            <div className="rapor-firma-ad">{firma}</div>
            <div className="alt">Firma</div>
          </div>
        </div>
        <div className="rapor-orta">
          <div className="rapor-ust">AYLIK İSG KPI RAPORU</div>
          <div className="rapor-donem">{donemAdi}</div>
        </div>
        <div className="rapor-sag">
          <div className="rapor-tarih"><span className="alt">Rapor tarihi</span> {raporTarihi.toLocaleDateString('tr-TR')}</div>
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
            <button className="btn ikincil mini" onClick={() => window.print()}>Yazdır / PDF</button>
          </div>
        </div>
      </header>

      {hicVeriYok ? (
        <div className="kart bos-durum">
          <p>Henüz kayıt yok. Kaza, uygunsuzluk ve eğitim kayıtları girildikçe dashboard otomatik dolacak.</p>
        </div>
      ) : (
        <>
          <Grup baslik="Yönetici Özeti" sinif="ozet">
            <div className="ozet-ana">
              <div className="ozet-hero">
                <div className="ozet-hero-deger">{o.toplamKaza}</div>
                <div className="ozet-hero-etiket">TOPLAM KAZA/OLAY SAYISI</div>
                <div className={`durum-rozet ${o.olumluKaza > 0 ? 'kritik' : 'iyi'}`}>
                  <span aria-hidden>{o.olumluKaza > 0 ? '✕' : '✓'}</span>
                  {o.olumluKaza > 0 ? `${o.olumluKaza} ölümlü kaza` : 'Ölümlü kaza yok'}
                </div>
              </div>
              <div className="ozet-gruplar">
                <div className="ozet-grup">
                  <div className="ozet-grup-ad">Kaza/Olay</div>
                  <div className="say-satir">
                    <Say deger={o.ilkYardim} etiket="İlk yardım" renk="var(--s1)" />
                    <Say deger={o.tibbiMudahaleli} etiket="Tıbbi müdahaleli" renk="var(--s2)" />
                    <Say deger={o.gunKayipliKaza} etiket="Gün kayıplı" renk="var(--s3)" />
                    <Say deger={o.maddiHasarli} etiket="Maddi hasarlı" renk="var(--s4)" />
                    <Say deger={o.kayipGun} etiket="Kayıp iş günü" renk="var(--s8)" />
                  </div>
                </div>
                <div className="ozet-grup">
                  <div className="ozet-grup-ad">Hızlar</div>
                  <div className="say-satir">
                    <Say deger={SAYI_BICIMI.format(o.siklikHizi)} etiket="Kaza sıklık hızı" renk="var(--s1)" />
                    <Say deger={SAYI_BICIMI.format(o.agirlikHizi)} etiket="Kaza ağırlık hızı" renk="var(--s1)" />
                  </div>
                </div>
                <div className="ozet-grup">
                  <div className="ozet-grup-ad">Uygunsuzluk</div>
                  <div className="say-satir">
                    <Say deger={o.uygunsuzluklar.length} etiket="Toplam" renk="var(--s8)" />
                    <Say deger={o.acikUygunsuzluk} etiket="Açık" renk="var(--serious)" />
                    <Say deger={o.kapaliUygunsuzluk} etiket="Kapalı" renk="var(--good)" />
                  </div>
                </div>
                <div className="ozet-grup">
                  <div className="ozet-grup-ad">Eğitim</div>
                  <div className="say-satir">
                    <Say deger={o.egitimKonu} etiket="Eğitim konusu" renk="var(--s2)" />
                    <Say deger={o.egitimKisi} etiket="Eğitim alan kişi" renk="var(--s2)" />
                  </div>
                </div>
              </div>
            </div>
          </Grup>

          <div className="rapor-kolonlar">
            <div className="kolon">
              <Grup baslik="Kaza/Olay İstatistikleri">
                <h4 className="alt-baslik">Kaza/Olay Türleri</h4>
                <HalkaGrafik veri={turDagilimi} />
                <h4 className="alt-baslik">Yaralanma Bölgesi</h4>
                <VucutHaritasi sayilar={bolgeSayilari} />
              </Grup>
            </div>

            <div className="kolon">
              <Grup baslik="Kaza/Olay Çeşidi">
                <YatayBar veri={cesitDagilimi} />
              </Grup>
            </div>

            <div className="kolon">
              <Grup baslik="Kaza/Olay Kök Sebepleri">
                <YatayBar veri={kokSebepDagilimi} renk="var(--s5)" />
              </Grup>
            </div>
          </div>

          <div className="rapor-alt">
            <Grup baslik={`Aylara Göre Kaza/Olay Dağılımı — ${yil} (Toplam: ${yildakiKazalar.length})`}>
              <AylikBar veri={aylik} />
            </Grup>
            <Grup baslik="Uygunsuzluk İstatistikleri">
              <HalkaGrafik
                veri={[
                  { ad: 'AÇIK', sayi: o.acikUygunsuzluk },
                  { ad: 'KAPALI', sayi: o.kapaliUygunsuzluk },
                ].filter((d) => d.sayi > 0)}
                renkSirasi={['#ec835a', '#0ca30c']}
              />
              <h4 className="alt-baslik">Uygunsuzluk Kök Nedenleri</h4>
              <YatayBar veri={uygKokNeden} renk="var(--s8)" />
            </Grup>
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
