import { useState } from 'react';
import type { FormEvent } from 'react';
import { girisYap, hataMetni } from '../store';

export function Giris() {
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    setBekliyor(true);
    try {
      await girisYap(eposta, sifre);
    } catch (err) {
      setHata(hataMetni(err));
    } finally {
      setBekliyor(false);
    }
  };

  return (
    <div className="giris-sayfa">
      <div className="giris-kart kart">
        <div className="giris-marka">
          <div className="logo" aria-hidden>İG</div>
          <div>
            <h1>İSG Yönetim Sistemi</h1>
            <div className="alt">Aylık İSG göstergeleri</div>
          </div>
        </div>

        <form onSubmit={gonder} className="giris-form">
          <div className="alan">
            <label htmlFor="g-eposta">E-posta</label>
            <input id="g-eposta" type="email" required autoComplete="email" value={eposta}
              onChange={(e) => setEposta(e.target.value)} />
          </div>
          <div className="alan">
            <label htmlFor="g-sifre">Şifre</label>
            <input id="g-sifre" type="password" required autoComplete="current-password"
              value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </div>
          {hata && <div className="uyari hata" role="alert">{hata}</div>}
          <button type="submit" className="btn" disabled={bekliyor}>
            {bekliyor ? 'Lütfen bekleyin…' : 'Giriş Yap'}
          </button>
          <p className="bilgi-notu" style={{ margin: 0 }}>
            Hesabınız yoksa sistem yöneticinizle görüşün.
          </p>
        </form>
      </div>
    </div>
  );
}
