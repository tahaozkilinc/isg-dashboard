import { useState } from 'react';
import type { FormEvent } from 'react';
import { girisYap, kayitOl, hataMetni } from '../store';

export function Giris() {
  const [mod, setMod] = useState<'giris' | 'kayit'>('giris');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    setBilgi('');
    setBekliyor(true);
    try {
      if (mod === 'giris') {
        await girisYap(eposta, sifre);
      } else {
        const girildi = await kayitOl(eposta, sifre, adSoyad);
        if (!girildi) {
          setBilgi('Kaydınız oluşturuldu. E-posta adresinize gelen doğrulama bağlantısına tıkladıktan sonra giriş yapın.');
          setMod('giris');
          setSifre('');
        }
      }
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
            <div className="alt">Aylık KPI Raporu ve İş Kazası Takibi</div>
          </div>
        </div>

        <div className="giris-sekmeler" role="tablist">
          <button type="button" role="tab" aria-selected={mod === 'giris'}
            className={mod === 'giris' ? 'aktif' : ''} onClick={() => { setMod('giris'); setHata(''); }}>
            Giriş Yap
          </button>
          <button type="button" role="tab" aria-selected={mod === 'kayit'}
            className={mod === 'kayit' ? 'aktif' : ''} onClick={() => { setMod('kayit'); setHata(''); setBilgi(''); }}>
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={gonder} className="giris-form">
          {mod === 'kayit' && (
            <div className="alan">
              <label htmlFor="g-ad">Ad Soyad</label>
              <input id="g-ad" type="text" required autoComplete="name" value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)} />
            </div>
          )}
          <div className="alan">
            <label htmlFor="g-eposta">E-posta</label>
            <input id="g-eposta" type="email" required autoComplete="email" value={eposta}
              onChange={(e) => setEposta(e.target.value)} />
          </div>
          <div className="alan">
            <label htmlFor="g-sifre">Şifre</label>
            <input id="g-sifre" type="password" required minLength={6}
              autoComplete={mod === 'giris' ? 'current-password' : 'new-password'}
              value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </div>
          {hata && <div className="uyari hata" role="alert">{hata}</div>}
          {bilgi && <div className="uyari bilgi" role="status">{bilgi}</div>}
          <button type="submit" className="btn" disabled={bekliyor}>
            {bekliyor ? 'Lütfen bekleyin…' : mod === 'giris' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
          {mod === 'kayit' && (
            <p className="bilgi-notu" style={{ margin: 0 }}>
              Hesabınız oluşturulduktan sonra yönetici onayı gerekir. İlk kaydolan kişi otomatik olarak yönetici olur.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
