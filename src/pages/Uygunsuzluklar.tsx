import { useState } from 'react';
import type { FormEvent } from 'react';
import { useIsgVeri, eylemler, yeniId } from '../store';
import { KOK_SEBEPLER } from '../types';

const BUGUN = () => new Date().toISOString().slice(0, 10);

export function Uygunsuzluklar() {
  const veri = useIsgVeri();
  const [tarih, setTarih] = useState(BUGUN());
  const [baslik, setBaslik] = useState('');
  const [kokSebep, setKokSebep] = useState<string>(KOK_SEBEPLER[0]);

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    if (!baslik.trim()) return;
    eylemler.uygunsuzlukEkle({ id: yeniId(), tarih, baslik: baslik.trim(), kokSebep, durum: 'AÇIK' });
    setBaslik('');
  };

  const kayitlar = [...veri.uygunsuzluklar].sort((a, b) => b.tarih.localeCompare(a.tarih));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="kart">
        <h3>Yeni Uygunsuzluk Bildirimi</h3>
        <form onSubmit={gonder}>
          <div className="form-grid">
            <div className="alan">
              <label htmlFor="u-tarih">Tarih *</label>
              <input id="u-tarih" type="date" required value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </div>
            <div className="alan genis">
              <label htmlFor="u-baslik">Uygunsuzluk Tanımı *</label>
              <input id="u-baslik" type="text" required placeholder="Örn. Acil çıkış kapısı önünde malzeme istifi"
                value={baslik} onChange={(e) => setBaslik(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="u-kok">Kök Neden *</label>
              <select id="u-kok" value={kokSebep} onChange={(e) => setKokSebep(e.target.value)}>
                {KOK_SEBEPLER.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button type="submit" className="btn">Uygunsuzluğu Kaydet</button>
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Uygunsuzluk Kayıtları ({kayitlar.length})</h3>
        {kayitlar.length === 0 ? (
          <div className="bos-durum">Henüz uygunsuzluk kaydı yok.</div>
        ) : (
          <div className="tablo-sar">
            <table className="veri">
              <thead>
                <tr><th>Tarih</th><th>Tanım</th><th>Kök Neden</th><th>Durum</th><th></th></tr>
              </thead>
              <tbody>
                {kayitlar.map((u) => (
                  <tr key={u.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(u.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>{u.baslik}</td>
                    <td>{u.kokSebep}</td>
                    <td>
                      <span className={`rozet ${u.durum === 'AÇIK' ? 'acik' : 'kapali'}`}>{u.durum}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn ikincil mini" onClick={() => eylemler.uygunsuzlukDurumDegistir(u.id)}>
                        {u.durum === 'AÇIK' ? 'Kapat' : 'Yeniden Aç'}
                      </button>{' '}
                      <button
                        className="btn tehlike mini"
                        onClick={() => { if (confirm('Bu uygunsuzluk kaydı silinsin mi?')) eylemler.uygunsuzlukSil(u.id); }}
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
