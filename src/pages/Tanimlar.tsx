import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, useYetki, eylemler, hataMetni } from '../store';
import { ROLLER } from '../types';
import type { Rol } from '../types';

/** Karıştırılabilen karakterler (0/O, 1/l/I) içermeyen rastgele şifre */
function sifreUret(uzunluk = 12): string {
  const harfler = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rastgele = crypto.getRandomValues(new Uint32Array(uzunluk));
  return Array.from(rastgele, (n) => harfler[n % harfler.length]).join('');
}

export function Tanimlar() {
  const { kullanicilar, oturum, ayarlar } = useDurum();
  const { veriGirebilir } = useYetki();
  const [firma, setFirma] = useState(ayarlar.firmaAdi);
  const [firmaMesaj, setFirmaMesaj] = useState('');
  const [eposta, setEposta] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [rol, setRol] = useState<Rol>('uzman');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
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
    setBasari('');
    if (sifre && sifre.length < 8) { setHata('Şifre en az 8 karakter olmalı.'); return; }
    setBekliyor(true);
    await calistir(async () => {
      if (sifre) {
        await eylemler.kullaniciOlustur({ eposta, adSoyad, rol, sifre });
        setBasari(`✓ ${eposta.trim().toLowerCase()} hesabı oluşturuldu. Şifreyi kullanıcıya iletin; isterse Profilim sayfasından değiştirebilir.`);
      } else {
        await eylemler.kullaniciEkle({ eposta, adSoyad, rol });
        setBasari(`✓ ${eposta.trim().toLowerCase()} tanımlandı (hesap Supabase'de zaten açık olmalı).`);
      }
      setEposta(''); setAdSoyad(''); setSifre('');
    });
    setBekliyor(false);
  };

  const sifreBelirle = async (hedef: string) => {
    const yeni = window.prompt(`${hedef} için yeni şifre (en az 8 karakter):`, sifreUret());
    if (yeni === null) return;
    setBasari('');
    if (yeni.length < 8) { setHata('Şifre en az 8 karakter olmalı.'); return; }
    await calistir(async () => {
      await eylemler.kullaniciSifreBelirle(hedef, yeni);
      setBasari(`✓ ${hedef} için şifre güncellendi. Yeni şifre: ${yeni}`);
    });
  };

  return (
    <div className="tanimlar">
      {!veriGirebilir && (
        <div className="uyari bilgi" role="note">
          Yönetici rolü yalnızca tanımlama yapar; kaza ve aylık veri girişi yapamaz. Veri girecek kişiyi
          <strong> İSG Uzmanı</strong> olarak tanımlayın ya da kendi rolünüzü <strong>Yönetici + İSG Uzmanı</strong> yapın.
        </div>
      )}
      {hata && <div className="uyari hata" role="alert">{hata}</div>}
      {basari && <div className="uyari iyi" role="status">{basari}</div>}

      <div className="kart">
        <h3>Firma bilgisi</h3>
        <form onSubmit={firmaKaydet} className="form-grid" style={{ alignItems: 'end' }}>
          <div className="alan">
            <label htmlFor="t-firma">Firma adı (dashboard başlığında görünür)</label>
            <input id="t-firma" value={firma} maxLength={120} onChange={(e) => setFirma(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn" type="submit">Kaydet</button>
            {firmaMesaj && <span style={{ color: 'var(--good-text)', fontWeight: 600 }}>{firmaMesaj}</span>}
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Yeni kullanıcı oluştur</h3>
        <p className="bilgi-notu" style={{ marginTop: 0 }}>
          Ad, e-posta ve şifreyi siz belirlersiniz; kullanıcı bu bilgilerle hemen giriş yapar ve isterse şifresini
          kendi <strong>Profilim</strong> sayfasından değiştirir.
        </p>
        <form onSubmit={kullaniciEkle}>
          <div className="form-grid">
            <div className="alan">
              <label htmlFor="n-ad">Ad soyad *</label>
              <input id="n-ad" required value={adSoyad} maxLength={120} onChange={(e) => setAdSoyad(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="n-eposta">E-posta *</label>
              <input id="n-eposta" type="email" required value={eposta} onChange={(e) => setEposta(e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="n-rol">Rol *</label>
              <select id="n-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                {ROLLER.filter((r) => r.rol !== 'pasif').map((r) => <option key={r.rol} value={r.rol}>{r.ad}</option>)}
              </select>
            </div>
            <div className="alan">
              <label htmlFor="n-sifre">Şifre (en az 8 karakter)</label>
              <div className="sifre-satir">
                <input id="n-sifre" type={sifreGoster ? 'text' : 'password'} value={sifre} autoComplete="new-password"
                  onChange={(e) => setSifre(e.target.value)} />
                <button type="button" className="btn ikincil mini" onClick={() => setSifreGoster((g) => !g)}>{sifreGoster ? 'Gizle' : 'Göster'}</button>
                <button type="button" className="btn ikincil mini" onClick={() => { setSifre(sifreUret()); setSifreGoster(true); }}>Üret</button>
              </div>
            </div>
          </div>
          <p className="bilgi-notu">
            Şifreyi boş bırakırsanız yalnızca rol tanımlanır; bu durumda hesabın Supabase panelinde açılmış olması gerekir.
          </p>
          <div style={{ marginTop: 10 }}>
            <button className="btn" type="submit" disabled={bekliyor}>{bekliyor ? 'Oluşturuluyor…' : 'Kullanıcıyı Oluştur'}</button>
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
                const secenekler = kendisi ? ROLLER.filter((r) => r.rol === 'admin' || r.rol === 'admin_uzman') : ROLLER;
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
                        className="kucuk" value={k.rol} aria-label={`${k.eposta} rolü`}
                        onChange={(e) => void calistir(() => eylemler.kullaniciGuncelle(k.eposta, { rol: e.target.value as Rol }))}
                      >
                        {secenekler.map((r) => <option key={r.rol} value={r.rol}>{r.ad}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn ikincil mini" onClick={() => void sifreBelirle(k.eposta)}>Şifre belirle</button>{' '}
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
        <h3>Roller</h3>
        <ul className="bolge-listesi">
          {ROLLER.map((r) => (
            <li key={r.rol}><strong style={{ minWidth: 150 }}>{r.ad}</strong><span className="isim">{r.aciklama}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
