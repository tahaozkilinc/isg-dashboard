import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, useYetki, eylemler, hataMetni } from '../store';
import { bugun, trTarih } from '../tarih';

export function Egitimler() {
  const { veri } = useDurum();
  const { yazabilir, silebilir } = useYetki();
  const [tarih, setTarih] = useState(bugun());
  const [konu, setKonu] = useState('');
  const [katilimci, setKatilimci] = useState(0);
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    if (!konu.trim()) return;
    setHata('');
    setBekliyor(true);
    try {
      await eylemler.egitimEkle({ tarih, konu: konu.trim(), katilimci: Math.max(0, Math.round(Number(katilimci) || 0)) });
      setKonu('');
      setKatilimci(0);
    } catch (err) {
      setHata(hataMetni(err));
    } finally {
      setBekliyor(false);
    }
  };

  const sil = async (id: string) => {
    if (!confirm('Bu eğitim kaydı silinsin mi?')) return;
    try {
      await eylemler.egitimSil(id);
    } catch (err) {
      setHata(hataMetni(err));
    }
  };

  const kayitlar = [...veri.egitimler].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const toplamKisi = kayitlar.reduce((t, e) => t + e.katilimci, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {yazabilir && (
        <div className="kart">
          <h3>Yeni İSG Eğitimi Kaydı</h3>
          <form onSubmit={gonder}>
            <div className="form-grid">
              <div className="alan">
                <label htmlFor="e-tarih">Eğitim Tarihi *</label>
                <input id="e-tarih" type="date" required value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </div>
              <div className="alan">
                <label htmlFor="e-konu">Eğitim Konusu *</label>
                <input id="e-konu" type="text" required maxLength={200} placeholder="Örn. Yangın ve Acil Durum"
                  value={konu} onChange={(e) => setKonu(e.target.value)} />
              </div>
              <div className="alan">
                <label htmlFor="e-katilimci">Katılımcı Sayısı *</label>
                <input id="e-katilimci" type="number" min={0} max={100000} required value={katilimci}
                  onChange={(e) => setKatilimci(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button type="submit" className="btn" disabled={bekliyor}>
                {bekliyor ? 'Kaydediliyor…' : 'Eğitimi Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {hata && <div className="uyari hata" role="alert">{hata}</div>}

      <div className="kart">
        <h3>Eğitim Kayıtları ({kayitlar.length} konu · {toplamKisi} katılımcı)</h3>
        {kayitlar.length === 0 ? (
          <div className="bos-durum">Henüz eğitim kaydı yok.</div>
        ) : (
          <div className="tablo-sar">
            <table className="veri">
              <thead>
                <tr><th>Tarih</th><th>Konu</th><th>Katılımcı</th>{silebilir && <th></th>}</tr>
              </thead>
              <tbody>
                {kayitlar.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{trTarih(e.tarih)}</td>
                    <td>{e.konu}</td>
                    <td className="sayi">{e.katilimci}</td>
                    {silebilir && <td><button className="btn tehlike mini" onClick={() => void sil(e.id)}>Sil</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
