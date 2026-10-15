import { useEffect, useState } from 'react';
import { useDurum, eylemler, hataMetni } from '../store';
import { ROLLER } from '../types';
import type { Rol } from '../types';

export function Kullanicilar() {
  const { profiller, kullanici } = useDurum();
  const [hata, setHata] = useState('');

  useEffect(() => {
    eylemler.profilleriYenile().catch((e) => setHata(hataMetni(e)));
  }, []);

  const rolDegistir = async (id: string, rol: Rol) => {
    setHata('');
    try {
      await eylemler.rolDegistir(id, rol);
    } catch (e) {
      setHata(hataMetni(e));
    }
  };

  const bekleyen = profiller.filter((p) => p.rol === 'beklemede');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {bekleyen.length > 0 && (
        <div className="uyari bilgi" role="status">
          {bekleyen.length} kullanıcı onayınızı bekliyor. Aşağıdan bir rol vererek erişim açabilirsiniz.
        </div>
      )}
      {hata && <div className="uyari hata" role="alert">{hata}</div>}

      <div className="kart">
        <h3>Kullanıcılar ({profiller.length})</h3>
        <div className="tablo-sar">
          <table className="veri">
            <thead>
              <tr><th>Ad Soyad</th><th>E-posta</th><th>Rol</th></tr>
            </thead>
            <tbody>
              {profiller.map((p) => {
                const kendisi = p.id === kullanici?.id;
                return (
                  <tr key={p.id}>
                    <td>{p.adSoyad || '—'}{kendisi && <span className="bilgi-notu"> (siz)</span>}</td>
                    <td>{p.eposta}</td>
                    <td>
                      <select
                        className="kucuk"
                        value={p.rol}
                        disabled={kendisi}
                        title={kendisi ? 'Kendi rolünüzü değiştiremezsiniz' : undefined}
                        aria-label={`${p.adSoyad || p.eposta} rolü`}
                        onChange={(e) => rolDegistir(p.id, e.target.value as Rol)}
                      >
                        {ROLLER.map((r) => <option key={r.rol} value={r.rol}>{r.ad}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kart">
        <h3>Rol Açıklamaları</h3>
        <ul className="bolge-listesi">
          {ROLLER.map((r) => (
            <li key={r.rol}><strong style={{ minWidth: 110 }}>{r.ad}</strong><span className="isim">{r.aciklama}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
