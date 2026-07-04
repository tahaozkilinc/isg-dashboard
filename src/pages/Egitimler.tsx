import { useState } from 'react';
import type { FormEvent } from 'react';
import { useIsgVeri, eylemler, yeniId } from '../store';

const BUGUN = () => new Date().toISOString().slice(0, 10);

export function Egitimler() {
  const veri = useIsgVeri();
  const [tarih, setTarih] = useState(BUGUN());
  const [konu, setKonu] = useState('');
  const [katilimci, setKatilimci] = useState(0);

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    if (!konu.trim()) return;
    eylemler.egitimEkle({ id: yeniId(), tarih, konu: konu.trim(), katilimci: Number(katilimci) || 0 });
    setKonu('');
    setKatilimci(0);
  };

  const kayitlar = [...veri.egitimler].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const toplamKisi = kayitlar.reduce((t, e) => t + e.katilimci, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              <input id="e-konu" type="text" required placeholder="Örn. Yangın ve Acil Durum"
                value={konu} onChange={(e) => setKonu(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="e-katilimci">Katılımcı Sayısı *</label>
              <input id="e-katilimci" type="number" min={0} required value={katilimci}
                onChange={(e) => setKatilimci(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="btn">Eğitimi Kaydet</button>
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Eğitim Kayıtları ({kayitlar.length} konu · {toplamKisi} katılımcı)</h3>
        {kayitlar.length === 0 ? (
          <div className="bos-durum">Henüz eğitim kaydı yok.</div>
        ) : (
          <div className="tablo-sar">
            <table className="veri">
              <thead>
                <tr><th>Tarih</th><th>Konu</th><th>Katılımcı</th><th></th></tr>
              </thead>
              <tbody>
                {kayitlar.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>{e.konu}</td>
                    <td className="sayi">{e.katilimci}</td>
                    <td>
                      <button
                        className="btn tehlike mini"
                        onClick={() => { if (confirm('Bu eğitim kaydı silinsin mi?')) eylemler.egitimSil(e.id); }}
                      >
                        Sil
                      </button>
                    </td>
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
