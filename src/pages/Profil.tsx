import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, sifreDegistir, hataMetni } from '../store';
import { ROLLER } from '../types';

export function Profil() {
  const { oturum, adSoyad, rol } = useDurum();
  const [mevcut, setMevcut] = useState('');
  const [yeni, setYeni] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata(''); setBasari('');
    if (yeni.length < 8) { setHata('Yeni şifre en az 8 karakter olmalı.'); return; }
    if (yeni !== tekrar) { setHata('Yeni şifre ve tekrarı aynı değil.'); return; }
    if (yeni === mevcut) { setHata('Yeni şifre mevcut şifreyle aynı olamaz.'); return; }
    setBekliyor(true);
    try {
      await sifreDegistir(mevcut, yeni);
      setBasari('✓ Şifreniz değiştirildi. Bir sonraki girişte yeni şifrenizi kullanın.');
      setMevcut(''); setYeni(''); setTekrar('');
    } catch (err) {
      setHata(hataMetni(err));
    } finally {
      setBekliyor(false);
    }
  };

  return (
    <div className="profil">
      <div className="kart">
        <h3>Profilim</h3>
        <dl className="profil-bilgi">
          <dt>Ad soyad</dt><dd>{adSoyad || '—'}</dd>
          <dt>E-posta</dt><dd>{oturum?.eposta}</dd>
          <dt>Rol</dt><dd>{ROLLER.find((r) => r.rol === rol)?.ad}</dd>
        </dl>
      </div>

      <form className="kart" onSubmit={gonder}>
        <h3>Şifremi değiştir</h3>
        <div className="form-grid" style={{ gridTemplateColumns: 'minmax(220px, 360px)' }}>
          <div className="alan">
            <label htmlFor="p-mevcut">Mevcut şifre</label>
            <input id="p-mevcut" type="password" required autoComplete="current-password" value={mevcut} onChange={(e) => setMevcut(e.target.value)} />
          </div>
          <div className="alan">
            <label htmlFor="p-yeni">Yeni şifre (en az 8 karakter)</label>
            <input id="p-yeni" type="password" required minLength={8} autoComplete="new-password" value={yeni} onChange={(e) => setYeni(e.target.value)} />
          </div>
          <div className="alan">
            <label htmlFor="p-tekrar">Yeni şifre (tekrar)</label>
            <input id="p-tekrar" type="password" required minLength={8} autoComplete="new-password" value={tekrar} onChange={(e) => setTekrar(e.target.value)} />
          </div>
        </div>
        {hata && <div className="uyari hata" role="alert" style={{ marginTop: 12 }}>{hata}</div>}
        {basari && <div className="uyari iyi" role="status" style={{ marginTop: 12 }}>{basari}</div>}
        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit" disabled={bekliyor}>{bekliyor ? 'Değiştiriliyor…' : 'Şifreyi Değiştir'}</button>
        </div>
      </form>
    </div>
  );
}
