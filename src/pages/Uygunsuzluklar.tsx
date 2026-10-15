import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, useYetki, eylemler, hataMetni } from '../store';
import { bugun, trTarih } from '../tarih';
import { KOK_SEBEPLER } from '../types';

export function Uygunsuzluklar() {
  const { veri } = useDurum();
  const { yazabilir, silebilir } = useYetki();
  const [tarih, setTarih] = useState(bugun());
  const [baslik, setBaslik] = useState('');
  const [kokSebep, setKokSebep] = useState<string>(KOK_SEBEPLER[0]);
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const calistir = async (is: () => Promise<void>) => {
    setHata('');
    try {
      await is();
    } catch (err) {
      setHata(hataMetni(err));
    }
  };

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    if (!baslik.trim()) return;
    setBekliyor(true);
    await calistir(async () => {
      await eylemler.uygunsuzlukEkle({ tarih, baslik: baslik.trim(), kokSebep });
      setBaslik('');
    });
    setBekliyor(false);
  };

  const kayitlar = [...veri.uygunsuzluklar].sort((a, b) => b.tarih.localeCompare(a.tarih));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {yazabilir && (
        <div className="kart">
          <h3>Yeni Uygunsuzluk Bildirimi</h3>
          <form onSubmit={gonder}>
            <div className="form-grid">
              <div className="alan">
                <label htmlFor="u-tarih">Tarih *</label>
                <input id="u-tarih" type="date" required max={bugun()} value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </div>
              <div className="alan genis">
                <label htmlFor="u-baslik">Uygunsuzluk Tanımı *</label>
                <input id="u-baslik" type="text" required maxLength={300} placeholder="Örn. Acil çıkış kapısı önünde malzeme istifi"
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
              <button type="submit" className="btn" disabled={bekliyor}>
                {bekliyor ? 'Kaydediliyor…' : 'Uygunsuzluğu Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {hata && <div className="uyari hata" role="alert">{hata}</div>}

      <div className="kart">
        <h3>Uygunsuzluk Kayıtları ({kayitlar.length})</h3>
        {kayitlar.length === 0 ? (
          <div className="bos-durum">Henüz uygunsuzluk kaydı yok.</div>
        ) : (
          <div className="tablo-sar">
            <table className="veri">
              <thead>
                <tr><th>Tarih</th><th>Tanım</th><th>Kök Neden</th><th>Durum</th>{yazabilir && <th></th>}</tr>
              </thead>
              <tbody>
                {kayitlar.map((u) => (
                  <tr key={u.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{trTarih(u.tarih)}</td>
                    <td>{u.baslik}</td>
                    <td>{u.kokSebep}</td>
                    <td><span className={`rozet ${u.durum === 'AÇIK' ? 'acik' : 'kapali'}`}>{u.durum}</span></td>
                    {yazabilir && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn ikincil mini" onClick={() => void calistir(() => eylemler.uygunsuzlukDurumDegistir(u.id))}>
                          {u.durum === 'AÇIK' ? 'Kapat' : 'Yeniden Aç'}
                        </button>{' '}
                        {silebilir && (
                          <button className="btn tehlike mini" onClick={() => {
                            if (confirm('Bu uygunsuzluk kaydı silinsin mi?')) void calistir(() => eylemler.uygunsuzlukSil(u.id));
                          }}>Sil</button>
                        )}
                      </td>
                    )}
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
