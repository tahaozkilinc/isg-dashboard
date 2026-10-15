import { useState } from 'react';
import type { FormEvent } from 'react';
import { girisYap, hataMetni } from '../store';
import { Logo, MisirDeseni } from '../components/Logo';

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
      <aside className="giris-marka-panel">
        <div className="logo-plaka giris-logo"><Logo yukseklik={40} /></div>
        <div className="giris-marka-icerik">
          <h1>İş Sağlığı ve Güvenliği<br />Yönetim Sistemi</h1>
          <p>Aylık iş güvenliği göstergelerinin tek ekranda takibi.</p>
          <ul className="giris-ozellikler">
            <li>Kazasız gün sayacı ve aylık kaza durumu</li>
            <li>Önceki yıllarla karşılaştırmalı göstergeler</li>
            <li>Rol bazlı, güvenli erişim</li>
          </ul>
        </div>
        <MisirDeseni sinif="giris-desen" />
        <div className="giris-alt-yazi">© {new Date().getFullYear()} Sunar Mısır Ent. Tes. San. ve Tic. A.Ş.</div>
      </aside>

      <main className="giris-form-panel">
        <div className="giris-kart">
          <div className="giris-baslik-satiri">
            <span className="altin-cizgi" aria-hidden />
            <h2>Giriş yap</h2>
          </div>
          <p className="giris-aciklama">Hesabınızla oturum açarak devam edin.</p>
          <form onSubmit={gonder} className="giris-form">
            <div className="alan">
              <label htmlFor="g-eposta">E-posta</label>
              <input id="g-eposta" type="email" required autoComplete="email" placeholder="E-posta adresiniz"
                value={eposta} onChange={(e) => setEposta(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="g-sifre">Şifre</label>
              <input id="g-sifre" type="password" required autoComplete="current-password"
                value={sifre} onChange={(e) => setSifre(e.target.value)} />
            </div>
            {hata && <div className="uyari hata" role="alert">{hata}</div>}
            <button type="submit" className="btn genis-btn" disabled={bekliyor}>
              {bekliyor ? 'Lütfen bekleyin…' : 'Giriş Yap'}
            </button>
          </form>
          <p className="bilgi-notu giris-yardim">Hesabınız yoksa veya şifrenizi unuttuysanız sistem yöneticinizle görüşün.</p>
        </div>
      </main>
    </div>
  );
}
