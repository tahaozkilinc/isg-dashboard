import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useDurum } from '../store';
import { AYLAR, AYLAR_KISA } from '../types';
import {
  GOSTERGELER, GOSTERGE_HARITASI, GRUPLAR, aylikDegerler, birikim, deger, karsilastir, sayiYaz,
  sonVeriAyi, yilDegeri, yillar,
} from '../gostergeler';
import type { Durum, Veri } from '../gostergeler';
import { AylikSutun, AylikCizgi, YilSutunlari } from '../components/grafikler';
import { aylikSatirlar } from '../components/grafikVeri';

interface Baglam { veri: Veri; yil: number; oncekiYil: number; son: number }

function Bolum({ baslik, aciklama, children, sinif }: { baslik: string; aciklama?: string; children: ReactNode; sinif?: string }) {
  return (
    <section className={`grup ${sinif ?? ''}`}>
      <h3 className="grup-baslik">{baslik}</h3>
      <div className="grup-icerik">
        {aciklama && <p className="grup-aciklama">{aciklama}</p>}
        {children}
      </div>
    </section>
  );
}

const DURUM_IKON: Record<Durum, string> = { iyi: '✓', kotu: '!', notr: '•' };

/** Üstteki büyük sayaç kartı: değer + önceki yılla karşılaştırma */
function GostergeKarti({ kod, baslik, b, vurgu }: { kod: string; baslik: string; b: Baglam; vurgu?: string }) {
  const g = GOSTERGE_HARITASI[kod];
  const bu = yilDegeri(b.veri, b.yil, g);
  const onceki = yilDegeri(b.veri, b.oncekiYil, g);
  const k = karsilastir(g, bu, onceki, b.oncekiYil, b.son);
  const ondalik = g.ondalik ?? 0;
  const tam = b.son === 12;
  return (
    <div className={`sayac ${k ? k.durum : ''}`} style={vurgu ? ({ '--sayac-renk': vurgu } as CSSProperties) : undefined}>
      <div className="sayac-baslik">{baslik}</div>
      <div className="sayac-deger">
        {sayiYaz(bu, ondalik)}{bu !== null && g.birim && <span className="sayac-birim">{g.birim}</span>}
      </div>
      {k ? (
        <>
          <div className={`delta ${k.durum}`}>
            <span aria-hidden>{DURUM_IKON[k.durum]}</span>
            {g.birlesim === 'toplam'
              ? <>{k.yuzde === null ? sayiYaz(Math.abs(k.fark), 1) : `%${sayiYaz(Math.abs(k.yuzde))}`} {k.fark < 0 ? 'daha az' : k.fark > 0 ? 'daha fazla' : 'aynı'}</>
              : <>{k.fark > 0 ? '+' : ''}{sayiYaz(k.fark, 1)} puan</>}
          </div>
          <div className="sayac-not">
            {g.birlesim === 'toplam'
              ? (tam ? `${k.oncekiYil} toplamı: ${sayiYaz(onceki, ondalik)}` : `${k.oncekiYil} hızıyla bu sürede ≈${sayiYaz(k.taban, 1)} olurdu`)
              : `${k.oncekiYil} ortalaması: ${sayiYaz(k.taban, ondalik)}`}
          </div>
        </>
      ) : (
        <div className="sayac-not">{b.oncekiYil} verisi yok</div>
      )}
    </div>
  );
}

/** Ay ay kaza durumu şeridi: yeşil = kazasız, kırmızı = kazalı, gri = veri yok */
function AySeridi({ b }: { b: Baglam }) {
  const kazalar = aylikDegerler(b.veri, b.yil, 'kaza_toplam');
  return (
    <div>
      <div className="ay-seridi" role="list" aria-label="Ay ay iş kazası sayısı">
        {kazalar.map((n, i) => {
          const sinif = n === null ? 'bos' : n === 0 ? 'temiz' : 'kazali';
          return (
            <div key={i} role="listitem" className={`ay-hucre ${sinif}`}
              title={n === null ? `${AYLAR[i]}: veri girilmemiş` : `${AYLAR[i]}: ${n} iş kazası`}>
              <span className="ay-ad">{AYLAR_KISA[i]}</span>
              <span className="ay-deger">{n === null ? '–' : n === 0 ? '✓' : n}</span>
            </div>
          );
        })}
      </div>
      <div className="lejant" style={{ marginTop: 8 }}>
        <span className="lejant-oge"><span className="kutu temiz" />Kazasız ay (✓)</span>
        <span className="lejant-oge"><span className="kutu kazali" />Kaza olan ay (sayı)</span>
        <span className="lejant-oge"><span className="kutu bos" />Veri girilmemiş</span>
      </div>
    </div>
  );
}

/** Kaza profili: toplam içindeki payı gösteren yatay çubuklar */
function KazaProfili({ b }: { b: Baglam }) {
  const toplam = birikim(b.veri, b.yil, 'kaza_toplam');
  const satirlar = [
    { kod: 'kaza_mavi', ad: 'Mavi yaka' }, { kod: 'kaza_beyaz', ad: 'Beyaz yaka' },
    { kod: 'kaza_erkek', ad: 'Erkek' }, { kod: 'kaza_kadin', ad: 'Kadın' },
    { kod: 'kaza_engelli', ad: 'Engelli çalışan' },
    { kod: 'kaza_gun_kayipli', ad: 'Gün kayıplı' }, { kod: 'kaza_gun_kayipsiz', ad: 'Gün kayıpsız' },
  ].map((s) => ({ ...s, n: birikim(b.veri, b.yil, s.kod) }));
  if (toplam === 0) return <div className="bos-durum">Bu dönemde iş kazası yok</div>;
  return (
    <div className="oranlar">
      {satirlar.map((s) => (
        <div key={s.kod} className="oran-satir">
          <span className="oran-ad">{s.ad}</span>
          <span className="oran-iz"><span className="oran-dolgu" style={{ width: `${(s.n / toplam) * 100}%` }} /></span>
          <span className="oran-sayi">{s.n}</span>
        </div>
      ))}
      <p className="bilgi-notu" style={{ marginTop: 4 }}>{b.yil} yılında toplam {toplam} kaza içindeki dağılım</p>
    </div>
  );
}

function GrupSatirlari({ grup, b, yillarSutunu }: { grup: string; b: Baglam; yillarSutunu: number[] }) {
  return (
    <>
      <tr className="grup-satiri"><td colSpan={16}>{grup}</td></tr>
      {GOSTERGELER.filter((g) => g.grup === grup).map((g) => {
        const od = g.ondalik ?? 0;
        return (
          <tr key={g.kod}>
            <td className="ilk">{g.ad}{g.birim && g.birim !== 'puan' && g.birim !== '%' ? <span className="birim"> ({g.birim})</span> : null}</td>
            {Array.from({ length: 12 }, (_, i) => (
              <td key={i} className="sayi">{sayiYaz(deger(b.veri, b.yil, i + 1, g.kod), od)}</td>
            ))}
            {yillarSutunu.map((y, i) => (
              <td key={y} className={`sayi ${i === 0 ? 'yil-vurgu' : 'yil'}`}>
                {g.birlesim === 'yok' && i === 0 && deger(b.veri, y, 0, g.kod) === null
                  ? <span className="bilgi-notu">yıl sonu</span>
                  : sayiYaz(yilDegeri(b.veri, y, g), od)}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}

function GostergeTablosu({ b }: { b: Baglam }) {
  const yillarSutunu = [b.yil, b.oncekiYil, b.oncekiYil - 1];
  return (
    <div className="tablo-sar">
      <table className="veri gosterge-tablosu">
        <thead>
          <tr>
            <th className="ilk">Gösterge</th>
            {AYLAR_KISA.map((a) => <th key={a} className="sayi">{a}</th>)}
            {yillarSutunu.map((y, i) => <th key={y} className={`sayi ${i === 0 ? 'yil-vurgu' : 'yil'}`}>{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {GRUPLAR.map((grup) => (
            <GrupSatirlari key={grup} grup={grup} b={b} yillarSutunu={yillarSutunu} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const { veri, ayarlar } = useDurum();

  const varsayilanYil = useMemo(() => {
    const dolu = yillar(veri).find((y) => sonVeriAyi(veri, y) > 0);
    return dolu ?? new Date().getFullYear();
  }, [veri]);
  const [secilen, setSecilen] = useState<number | null>(null);
  const yil = secilen ?? varsayilanYil;

  const yilSecenekleri = useMemo(() => {
    const s = new Set<number>(yillar(veri).filter((y) => sonVeriAyi(veri, y) > 0));
    s.add(varsayilanYil);
    return [...s].sort((a, b) => b - a);
  }, [veri, varsayilanYil]);

  const son = sonVeriAyi(veri, yil);
  const b: Baglam = { veri, yil, oncekiYil: yil - 1, son };
  const ay = (kod: string) => aylikDegerler(veri, yil, kod);
  const renk = (n: number) => `var(--s${n})`;

  if (Object.keys(veri).length === 0) {
    return <div className="kart bos-durum"><p>Henüz veri girilmemiş. İSG uzmanı "Aylık Veri Girişi" sayfasından göstergeleri girdikçe dashboard dolacak.</p></div>;
  }

  // Kazasız gün: veri girilmiş en son ayın değeri
  const kazasizDizi = ay('son_kazadan_gecen_gun');
  let kazasizGun: number | null = null;
  for (let i = 11; i >= 0; i--) if (kazasizDizi[i] !== null) { kazasizGun = kazasizDizi[i]; break; }
  const seri = kazasizGun === null ? null : kazasizGun >= 30 ? 'iyi' : kazasizGun >= 7 ? 'izle' : 'kotu';

  const donem = son > 0 ? (son === 1 ? AYLAR[0] : `${AYLAR[0]}–${AYLAR[son - 1]}`) : 'Veri yok';
  const yilEtiketi = (y: number) => (y === yil && son > 0 && son < 12 ? `${y}*` : String(y));
  const yilNoktalari = (kod: string) => [yil - 2, yil - 1, yil].map((y) => ({
    etiket: yilEtiketi(y), deger: yilDegeri(veri, y, GOSTERGE_HARITASI[kod]), guncel: y === yil,
    not: y === yil && son < 12 ? donem : 'Yıl toplamı',
  }));
  const yilNotu = son > 0 && son < 12 ? `* ${yil}: yalnızca ${donem} ayları` : undefined;
  const oncekiOrt = (kod: string) => yilDegeri(veri, yil - 1, GOSTERGE_HARITASI[kod]);
  const denetimRef = oncekiOrt('ic_denetim_puani');
  const gerceklesmeRef = oncekiOrt('gerceklesme_puani');

  return (
    <div className="rapor">
      <header className="rapor-baslik">
        <div className="rapor-firma">
          <div className="logo logo-buyuk" aria-hidden>
            {ayarlar.firmaAdi.split(/\s+/).map((k) => k[0]).join('').slice(0, 2).toLocaleUpperCase('tr')}
          </div>
          <div>
            <div className="rapor-firma-ad">{ayarlar.firmaAdi}</div>
            <div className="alt">Temel iş güvenliği istatistikleri</div>
          </div>
        </div>
        <div className="rapor-orta">
          <div className="rapor-ust">İSG KPI RAPORU</div>
          <div className="rapor-donem">{yil}</div>
          <div className="alt">{son > 0 ? `${donem} · son veri: ${AYLAR[son - 1]}` : donem}</div>
        </div>
        <div className="rapor-sag">
          <div className="donem-secim">
            <select className="kucuk" value={yil} onChange={(e) => setSecilen(Number(e.target.value))} aria-label="Yıl">
              {yilSecenekleri.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn ikincil mini" onClick={() => window.print()}>Yazdır / PDF</button>
          </div>
        </div>
      </header>

      {/* 1) Kazasız gün + ay ay durum */}
      <section className={`hero ${seri ?? ''}`}>
        <div className="hero-sol">
          <div className="hero-ust">Son iş kazasından bu yana</div>
          <div className="hero-sayi">{sayiYaz(kazasizGun)}<span> gün</span></div>
          {seri && (
            <div className={`durum-rozet ${seri === 'iyi' ? 'iyi' : seri === 'izle' ? 'izle' : 'kritik'}`}>
              <span aria-hidden>{seri === 'iyi' ? '✓' : seri === 'izle' ? '•' : '!'}</span>
              {seri === 'iyi' ? 'Güvenli seri' : seri === 'izle' ? 'Yakından izleniyor' : 'Yakın zamanda kaza oldu'}
            </div>
          )}
          <div className="hero-alt">
            {yil} {donem}: <strong>{sayiYaz(birikim(veri, yil, 'kaza_toplam'))}</strong> iş kazası,{' '}
            <strong>{sayiYaz(birikim(veri, yil, 'kayip_gun'))}</strong> kayıp iş günü
          </div>
        </div>
        <div className="hero-sag">
          <div className="hero-ust">Ay ay iş kazası durumu — {yil}</div>
          <AySeridi b={b} />
        </div>
      </section>

      {/* 2) Ana göstergeler */}
      <div className="sayac-izgara">
        <GostergeKarti kod="kaza_toplam" baslik="İş kazası" b={b} vurgu={renk(6)} />
        <GostergeKarti kod="kayip_gun" baslik="Kayıp iş günü" b={b} vurgu={renk(8)} />
        <GostergeKarti kod="ramak_kala" baslik="Ramak kala / risk bildirimi" b={b} vurgu={renk(1)} />
        <GostergeKarti kod="iyilestirme_faaliyet" baslik="İyileştirme faaliyeti" b={b} vurgu={renk(2)} />
        <GostergeKarti kod="ic_denetim_puani" baslik="İç denetim puanı" b={b} vurgu={renk(5)} />
        <GostergeKarti kod="gerceklesme_puani" baslik="Gerçekleşme puanı" b={b} vurgu={renk(5)} />
      </div>

      {/* 3) İş kazaları */}
      <div className="rapor-izgara">
        <Bolum baslik="İş kazaları — aylık" aciklama="Her ay kaç iş kazası oldu? Sütunlar mavi ve beyaz yaka çalışanları ayırır.">
          <AylikSutun
            yigin yukseklik={220} veri={aylikSatirlar({ kaza_mavi: ay('kaza_mavi'), kaza_beyaz: ay('kaza_beyaz') })}
            seriler={[{ anahtar: 'kaza_mavi', ad: 'Mavi yaka', renk: renk(1) }, { anahtar: 'kaza_beyaz', ad: 'Beyaz yaka', renk: renk(2) }]}
            birim="kaza"
          />
        </Bolum>
        <Bolum baslik="Kayıp iş günü — aylık" aciklama="Kazalar yüzünden her ay kaç iş günü kaybedildi?">
          <AylikSutun
            yukseklik={220} veri={aylikSatirlar({ kayip_gun: ay('kayip_gun') })}
            seriler={[{ anahtar: 'kayip_gun', ad: 'Kayıp gün', renk: renk(8) }]} birim="gün"
          />
        </Bolum>
        <Bolum baslik="Kaza profili" aciklama="Kazaya karışanların dağılımı.">
          <KazaProfili b={b} />
        </Bolum>
      </div>

      <div className="rapor-izgara">
        <Bolum baslik="Yıllara göre iş kazası" aciklama="Yıl yıl kaç iş kazası oldu? Renkli sütun bu yıl.">
          <YilSutunlari veri={yilNoktalari('kaza_toplam')} renk={renk(6)} birim="kaza" />
          {yilNotu && <p className="bilgi-notu">{yilNotu}</p>}
        </Bolum>
        <Bolum baslik="Yıllara göre kayıp iş günü" aciklama="Yıl yıl kaç iş günü kaybedildi?">
          <YilSutunlari veri={yilNoktalari('kayip_gun')} renk={renk(8)} birim="gün" />
          {yilNotu && <p className="bilgi-notu">{yilNotu}</p>}
        </Bolum>
        <Bolum baslik="Yıllara göre kazasız gün" aciklama="Kazasız geçen toplam gün sayısı.">
          <YilSutunlari veri={yilNoktalari('yasanmayan_gun')} renk={renk(4)} birim="gün" />
          {yilNotu && <p className="bilgi-notu">{yilNotu}</p>}
        </Bolum>
      </div>

      {/* 4) Risk ve iyileştirme */}
      <div className="rapor-izgara iki">
        <Bolum baslik="Risk bildirimi ve iyileştirme" aciklama="Ne kadar çok bildirim ve iyileştirme, o kadar güçlü güvenlik kültürü.">
          <AylikSutun
            yukseklik={230}
            veri={aylikSatirlar({ ramak_kala: ay('ramak_kala'), iyilestirme_gozlem: ay('iyilestirme_gozlem'), iyilestirme_faaliyet: ay('iyilestirme_faaliyet') })}
            seriler={[
              { anahtar: 'ramak_kala', ad: 'Ramak kala / risk bildirimi', renk: renk(1) },
              { anahtar: 'iyilestirme_gozlem', ad: 'İyileştirme gözlemi', renk: renk(2) },
              { anahtar: 'iyilestirme_faaliyet', ad: 'İyileştirme faaliyeti', renk: renk(3) },
            ]}
          />
        </Bolum>
        <Bolum baslik="Günlük işbaşı iyileştirme" aciklama="Çalışanların işbaşında yaptığı günlük iyileştirmeler.">
          <AylikSutun yukseklik={230} veri={aylikSatirlar({ g: ay('gunluk_isbasi_iyilestirme') })} seriler={[{ anahtar: 'g', ad: 'İyileştirme', renk: renk(2) }]} birim="adet" />
        </Bolum>
      </div>

      {/* 5) Denetim */}
      <div className="rapor-izgara iki">
        <Bolum baslik="İç denetim puanı" aciklama="Her ay yapılan iç denetimin puanı. Kesikli çizgi önceki yılın ortalaması.">
          <AylikCizgi
            veri={aylikSatirlar({ p: ay('ic_denetim_puani') })} anahtar="p" ad="İç denetim puanı" renk={renk(5)}
            ondalik={1} alan={[70, 100]} tickSayisi={4}
            referans={denetimRef !== null ? { deger: denetimRef, etiket: `${yil - 1} ort. ${sayiYaz(denetimRef, 0)}` } : undefined}
          />
        </Bolum>
        <Bolum baslik="Gerçekleşme puanı (%)" aciklama="Planlanan çalışmaların ne kadarı yapıldı? Kesikli çizgi önceki yılın ortalaması.">
          <AylikCizgi
            veri={aylikSatirlar({ p: ay('gerceklesme_puani') })} anahtar="p" ad="Gerçekleşme puanı" renk={renk(5)}
            ondalik={0} alan={[90, 110]} tickSayisi={5} birim="%"
            referans={gerceklesmeRef !== null ? { deger: gerceklesmeRef, etiket: `${yil - 1} ort. %${sayiYaz(gerceklesmeRef, 0)}` } : undefined}
          />
        </Bolum>
      </div>

      {/* 6) Eğitim */}
      <div className="rapor-izgara">
        <Bolum baslik="İşe giriş eğitimi (saat)" aciklama="Yeni başlayanlara verilen eğitim süresi.">
          <AylikSutun yukseklik={190} veri={aylikSatirlar({ x: ay('ilk_ise_giris_egitim_saati') })} seriler={[{ anahtar: 'x', ad: 'Saat', renk: renk(2) }]} birim="saat" />
        </Bolum>
        <Bolum baslik="Diğer eğitimler — katılımcı" aciklama="Eğitimlere katılan kişi sayısı.">
          <AylikSutun yukseklik={190} veri={aylikSatirlar({ x: ay('diger_egitim_katilimci') })} seriler={[{ anahtar: 'x', ad: 'Katılımcı', renk: renk(2) }]} birim="kişi" />
        </Bolum>
        <Bolum baslik="Diğer eğitimler — adam·saat" aciklama="Katılımcı sayısı × eğitim süresi.">
          <AylikSutun yukseklik={190} ondalik={1} veri={aylikSatirlar({ x: ay('diger_egitim_adam_saat') })} seriler={[{ anahtar: 'x', ad: 'Adam·saat', renk: renk(2) }]} birim="saat" />
        </Bolum>
      </div>

      {/* 7) Çalışma hayatı */}
      <div className="rapor-izgara">
        <Bolum baslik="İş izni sayısı" aciklama="Verilen iş izni (tehlikeli işler) adedi.">
          <AylikSutun yukseklik={190} veri={aylikSatirlar({ x: ay('is_izni') })} seriler={[{ anahtar: 'x', ad: 'İş izni', renk: renk(1) }]} birim="adet" />
        </Bolum>
        <Bolum baslik="İşe giriş sayısı" aciklama="Her ay işe başlayan kişi sayısı.">
          <AylikSutun yukseklik={190} veri={aylikSatirlar({ x: ay('ise_giris') })} seriler={[{ anahtar: 'x', ad: 'İşe giriş', renk: renk(1) }]} birim="kişi" />
        </Bolum>
        <Bolum baslik="Sağlık raporu gün sayısı" aciklama="Sağlık nedeniyle alınan rapor günleri.">
          <AylikSutun yukseklik={190} veri={aylikSatirlar({ x: ay('saglik_rapor_gun') })} seriler={[{ anahtar: 'x', ad: 'Rapor günü', renk: renk(1) }]} birim="gün" />
        </Bolum>
      </div>

      {/* 8) Tüm göstergeler tablosu (Excel'deki tablo) */}
      <Bolum baslik="Tüm göstergeler" aciklama="Excel'deki tablonun aynısı. Yıl sütunlarında sayılar toplanır, puanlar ortalaması alınır; “Son kazadan sonra geçen gün” son ayın değeridir.">
        <GostergeTablosu b={b} />
      </Bolum>
    </div>
  );
}
