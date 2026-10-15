import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, eylemler, hataMetni } from '../store';
import { AYLAR } from '../types';
import { kazaHesapla } from '../kazaHesap';
import type { Cinsiyet, Yaka } from '../kazaHesap';
import { sayiYaz } from '../gostergeler';

const bugun = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Secenek<T extends string>({ ad, secili, secenekler, onChange }: {
  ad: string; secili: T; secenekler: { deger: T; etiket: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="alan">
      <span className="etiket-metni" id={`seg-${ad}`}>{ad}</span>
      <div className="segment" role="radiogroup" aria-labelledby={`seg-${ad}`}>
        {secenekler.map((s) => (
          <button
            key={s.deger} type="button" role="radio" aria-checked={secili === s.deger}
            className={secili === s.deger ? 'aktif' : ''} onClick={() => onChange(s.deger)}
          >
            {s.etiket}
          </button>
        ))}
      </div>
    </div>
  );
}

export function KazaGirisi({ onDashboard }: { onDashboard: () => void }) {
  const { veri } = useDurum();
  const [tarih, setTarih] = useState(bugun());
  const [yaka, setYaka] = useState<Yaka>('mavi');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>('erkek');
  const [engelli, setEngelli] = useState(false);
  const [kayipGun, setKayipGun] = useState('0');
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gun = Number(kayipGun.replace(',', '.'));
  const gunGecerli = kayipGun.trim() !== '' && Number.isInteger(gun) && gun >= 0 && gun <= 365;
  const gelecek = tarih > bugun();

  const hesap = useMemo(
    () => (gunGecerli && !gelecek ? kazaHesapla(veri, { tarih, yaka, cinsiyet, engelli, kayipGun: gun }) : null),
    [veri, tarih, yaka, cinsiyet, engelli, gun, gunGecerli, gelecek],
  );

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    if (!hesap) return;
    setHata(''); setBasari(''); setBekliyor(true);
    try {
      await eylemler.veriKaydet(hesap.degisiklikler);
      const ay = Number(tarih.slice(5, 7));
      setBasari(`✓ Kaza ${AYLAR[ay - 1]} ${tarih.slice(0, 4)} göstergelerine işlendi. Dashboard güncellendi.`);
      setKayipGun('0'); setEngelli(false);
    } catch (err) {
      setHata(hataMetni(err));
    } finally {
      setBekliyor(false);
    }
  };

  return (
    <div className="kaza-girisi">
      <form className="kart" onSubmit={kaydet}>
        <h3>Yeni iş kazası girişi</h3>
        <p className="bilgi-notu" style={{ marginTop: 0 }}>
          Kazanın bilgilerini girin; ilgili ayın göstergeleri (kaza sayısı, kayıp gün, kazasız gün…) otomatik güncellenir.
        </p>
        <div className="form-grid">
          <div className="alan">
            <label htmlFor="kg-tarih">Kaza tarihi *</label>
            <input id="kg-tarih" type="date" required max={bugun()} value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </div>
          <Secenek ad="Çalışan grubu" secili={yaka} onChange={setYaka}
            secenekler={[{ deger: 'mavi', etiket: 'Mavi yaka' }, { deger: 'beyaz', etiket: 'Beyaz yaka' }]} />
          <Secenek ad="Cinsiyet" secili={cinsiyet} onChange={setCinsiyet}
            secenekler={[{ deger: 'erkek', etiket: 'Erkek' }, { deger: 'kadin', etiket: 'Kadın' }]} />
          <div className="alan">
            <label htmlFor="kg-gun">Kayıp iş günü *</label>
            <input id="kg-gun" inputMode="numeric" value={kayipGun} onChange={(e) => { setKayipGun(e.target.value); setBasari(''); }}
              aria-invalid={!gunGecerli} className={gunGecerli ? '' : 'gecersiz-alan'} />
            <span className="bilgi-notu" style={{ margin: 0 }}>Gün kaybı yoksa 0 bırakın (gün kayıpsız kaza sayılır).</span>
          </div>
          <label className="onay-kutusu">
            <input type="checkbox" checked={engelli} onChange={(e) => setEngelli(e.target.checked)} />
            Kazayı geçiren engelli çalışan
          </label>
        </div>

        {gelecek && <div className="uyari hata" role="alert" style={{ marginTop: 12 }}>Kaza tarihi bugünden sonra olamaz.</div>}
        {!gunGecerli && <div className="uyari hata" role="alert" style={{ marginTop: 12 }}>Kayıp iş günü 0 ile 365 arasında tam sayı olmalı.</div>}
        {hata && <div className="uyari hata" role="alert" style={{ marginTop: 12 }}>{hata}</div>}
        {basari && (
          <div className="uyari iyi" role="status" style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{basari}</span>
            <button type="button" className="btn ikincil mini" onClick={onDashboard}>Dashboard'u gör</button>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit" disabled={!hesap || bekliyor}>{bekliyor ? 'Kaydediliyor…' : 'Kazayı Kaydet'}</button>
        </div>
      </form>

      <div className="kart">
        <h3>Kaydedince değişecek göstergeler</h3>
        {hesap && hesap.ozet.length > 0 ? (
          <div className="tablo-sar">
            <table className="veri">
              <thead><tr><th>Gösterge</th><th>Ay</th><th className="sayi">Şimdi</th><th className="sayi">Sonra</th></tr></thead>
              <tbody>
                {hesap.ozet.map((o) => (
                  <tr key={`${o.ay}${o.kod}`}>
                    <td>{o.ad}</td>
                    <td>{AYLAR[o.ay - 1]}</td>
                    <td className="sayi">{sayiYaz(o.once)}</td>
                    <td className="sayi"><strong>{sayiYaz(o.sonra)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bos-durum">Geçerli bilgileri girince değişecek değerler burada görünür.</div>
        )}
        <p className="bilgi-notu">Yanlış girdiyseniz "Aylık Veri Girişi" sayfasından ilgili hücreleri düzeltebilirsiniz.</p>
      </div>
    </div>
  );
}
