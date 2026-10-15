import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, eylemler, hataMetni } from '../store';
import { ROLLER } from '../types';
import type { Rol } from '../types';

export function Tanimlar() {
  const { kullanicilar, oturum, ayarlar } = useDurum();
  const [firma, setFirma] = useState(ayarlar.firmaAdi);
  const [firmaMesaj, setFirmaMesaj] = useState('');
  const [eposta, setEposta] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [rol, setRol] = useState<Rol>('uzman');
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const calistir = async (is: () => Promise<void>) => {
    setHata('');
    try { await is(); } catch (e) { setHata(hataMetni(e)); }
  };

  const firmaKaydet = async (e: FormEvent) => {
    e.preventDefault();
    setFirmaMesaj('');
    await calistir(async () => {
      await eylemler.ayarlarGuncelle({ firmaAdi: firma.trim() || ayarlar.firmaAdi });
      setFirmaMesaj('✓ Kaydedildi');
    });
  };

  const kullaniciEkle = async (e: FormEvent) => {
    e.preventDefault();
    setBekliyor(true);
    await calistir(async () => {
      await eylemler.kullaniciEkle({ eposta, adSoyad, rol });
      setEposta(''); setAdSoyad('');
    });
    setBekliyor(false);
  };

  return (
    <div className="tanimlar">
      {hata && <div className="uyari hata" role="alert">{hata}</div>}

      <div className="kart">
        <h3>Firma bilgisi</h3>
        <form onSubmit={firmaKaydet} className="form-grid" style={{ alignItems: 'end' }}>
          <div className="alan">
            <label htmlFor="t-firma">Firma adı (dashboard başlığında görünür)</label>
            <input id="t-firma" value={firma} maxLength={120} onChange={(e) => setFirma(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn" type="submit">Kaydet</button>
            {firmaMesaj && <span style={{ color: 'var(--good)', fontWeight: 600 }}>{firmaMesaj}</span>}
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Kullanıcılar ({kullanicilar.length})</h3>
        <div className="tablo-sar">
          <table className="veri">
            <thead><tr><th>E-posta</th><th>Ad soyad</th><th>Rol</th><th></th></tr></thead>
            <tbody>
              {kullanicilar.map((k) => {
                const kendisi = k.eposta === oturum?.eposta.toLowerCase();
                return (
                  <tr key={k.eposta}>
                    <td>{k.eposta}{kendisi && <span className="bilgi-notu"> (siz)</span>}</td>
                    <td>
                      <input
                        className="kucuk" defaultValue={k.adSoyad} aria-label={`${k.eposta} ad soyad`} maxLength={120}
                        onBlur={(e) => { if (e.target.value.trim() !== k.adSoyad) void calistir(() => eylemler.kullaniciGuncelle(k.eposta, { adSoyad: e.target.value })); }}
                      />
                    </td>
                    <td>
                      <select
                        className="kucuk" value={k.rol} disabled={kendisi} aria-label={`${k.eposta} rolü`}
                        title={kendisi ? 'Kendi rolünüzü değiştiremezsiniz' : undefined}
                        onChange={(e) => void calistir(() => eylemler.kullaniciGuncelle(k.eposta, { rol: e.target.value as Rol }))}
                      >
                        {ROLLER.map((r) => <option key={r.rol} value={r.rol}>{r.ad}</option>)}
                      </select>
                    </td>
                    <td>
                      {!kendisi && (
                        <button
                          className="btn tehlike mini"
                          onClick={() => { if (confirm(`${k.eposta} tanımı silinsin mi? Kullanıcı sisteme giremez.`)) void calistir(() => eylemler.kullaniciSil(k.eposta)); }}
                        >
                          Sil
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kart">
        <h3>Yeni kullanıcı tanımla</h3>
        <ol className="adimlar">
          <li>Supabase panelinde <strong>Authentication → Users → Add user → Create new user</strong> ile e-posta ve şifreyi oluşturun (<em>Auto Confirm User</em> işaretli olsun).</li>
          <li>Aynı e-postayı aşağıya yazıp rolünü seçin. Kullanıcı bu e-posta ve şifreyle giriş yapabilir.</li>
        </ol>
        <form onSubmit={kullaniciEkle}>
          <div className="form-grid">
            <div className="alan">
              <label htmlFor="n-eposta">E-posta *</label>
              <input id="n-eposta" type="email" required value={eposta} onChange={(e) => setEposta(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="n-ad">Ad soyad</label>
              <input id="n-ad" value={adSoyad} maxLength={120} onChange={(e) => setAdSoyad(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="n-rol">Rol *</label>
              <select id="n-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                {ROLLER.filter((r) => r.rol !== 'pasif').map((r) => <option key={r.rol} value={r.rol}>{r.ad}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="submit" disabled={bekliyor}>{bekliyor ? 'Ekleniyor…' : 'Kullanıcıyı Tanımla'}</button>
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Roller</h3>
        <ul className="bolge-listesi">
          {ROLLER.map((r) => (
            <li key={r.rol}><strong style={{ minWidth: 110 }}>{r.ad}</strong><span className="isim">{r.aciklama}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
