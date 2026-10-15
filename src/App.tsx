import { useState } from 'react';
import { Component } from 'react';
import type { ReactNode } from 'react';
import { useDurum, useYetki, cikisYap, oturumuBaslat } from './store';
import { supabaseAyarliMi } from './supabase';
import { ROLLER } from './types';
import { Giris } from './pages/Giris';
import { Dashboard } from './pages/Dashboard';
import { KazaBildirimi } from './pages/KazaBildirimi';
import { Uygunsuzluklar } from './pages/Uygunsuzluklar';
import { Egitimler } from './pages/Egitimler';
import { Ayarlar } from './pages/Ayarlar';
import { Kullanicilar } from './pages/Kullanicilar';

type SayfaId = 'dashboard' | 'kaza' | 'uygunsuzluk' | 'egitim' | 'ayarlar' | 'kullanicilar';

class HataSiniri extends Component<{ children: ReactNode }, { hata: boolean }> {
  state = { hata: false };
  static getDerivedStateFromError() { return { hata: true }; }
  render() {
    if (this.state.hata) {
      return (
        <div className="tam-sayfa">
          <div className="kart giris-kart">
            <h3>Bir şeyler ters gitti</h3>
            <p>Sayfa beklenmeyen bir hata verdi. Yenileyip tekrar deneyin.</p>
            <button className="btn" onClick={() => location.reload()}>Sayfayı Yenile</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Mesaj({ baslik, metin, cikis }: { baslik: string; metin: string; cikis?: boolean }) {
  return (
    <div className="tam-sayfa">
      <div className="kart giris-kart">
        <h3>{baslik}</h3>
        <p style={{ color: 'var(--ink-2)' }}>{metin}</p>
        {cikis && <button className="btn ikincil" onClick={() => void cikisYap()}>Çıkış Yap</button>}
      </div>
    </div>
  );
}

oturumuBaslat();

function Uygulama() {
  const d = useDurum();
  const { yazabilir, admin } = useYetki();
  const [sayfa, setSayfa] = useState<SayfaId>('dashboard');

  if (!supabaseAyarliMi) {
    return (
      <Mesaj
        baslik="Kurulum gerekli"
        metin="Supabase bağlantısı ayarlanmamış. .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini ekleyin (bkz. README)."
      />
    );
  }
  if (!d.hazir) return <Mesaj baslik="Yükleniyor…" metin="Oturum kontrol ediliyor." />;
  if (!d.kullanici) return <Giris />;
  if (d.hata && !d.profil) return <Mesaj baslik="Bağlantı hatası" metin={d.hata} cikis />;

  const rol = d.profil?.rol;
  if (rol === 'beklemede') {
    return <Mesaj baslik="Onay bekleniyor" metin="Hesabınız oluşturuldu. Bir yönetici erişiminizi onayladığında sisteme girebilirsiniz." cikis />;
  }
  if (rol === 'pasif') {
    return <Mesaj baslik="Erişim kapalı" metin="Hesabınızın erişimi kapatılmış. Gerekirse sistem yöneticisiyle görüşün." cikis />;
  }
  if (!d.veriYuklendi) {
    return <Mesaj baslik="Veriler yükleniyor…" metin={d.hata ?? 'Lütfen bekleyin.'} cikis={Boolean(d.hata)} />;
  }

  const ayarlar = d.veri.ayarlar;
  const basHarfler = ayarlar.firmaAdi.split(/\s+/).map((k) => k[0]).join('').slice(0, 2).toLocaleUpperCase('tr');
  const bekleyen = d.profiller.filter((p) => p.rol === 'beklemede').length;

  const sekmeler: { id: SayfaId; ad: string }[] = [
    { id: 'dashboard', ad: 'Dashboard' },
    ...(yazabilir ? [
      { id: 'kaza' as const, ad: 'Kaza Bildirimi' },
      { id: 'uygunsuzluk' as const, ad: 'Uygunsuzluklar' },
      { id: 'egitim' as const, ad: 'Eğitimler' },
    ] : [
      { id: 'kaza' as const, ad: 'Kazalar' },
      { id: 'uygunsuzluk' as const, ad: 'Uygunsuzluklar' },
      { id: 'egitim' as const, ad: 'Eğitimler' },
    ]),
    ...(admin ? [
      { id: 'kullanicilar' as const, ad: bekleyen > 0 ? `Kullanıcılar (${bekleyen})` : 'Kullanıcılar' },
      { id: 'ayarlar' as const, ad: 'Ayarlar' },
    ] : []),
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="marka">
          <div className="logo" aria-hidden>{basHarfler || 'İG'}</div>
          <div>
            <h1>{ayarlar.firmaAdi}</h1>
            <div className="alt">İSG Yönetim Sistemi — Aylık KPI Raporu</div>
          </div>
        </div>
        <nav className="sekmeler" aria-label="Sayfalar">
          {sekmeler.map((s) => (
            <button key={s.id} className={`sekme ${sayfa === s.id ? 'aktif' : ''}`} onClick={() => setSayfa(s.id)}>
              {s.ad}
            </button>
          ))}
        </nav>
        <div className="kullanici-kutu">
          <div>
            <div className="kullanici-ad">{d.profil?.adSoyad || d.kullanici.eposta}</div>
            <div className="alt">{ROLLER.find((r) => r.rol === rol)?.ad}</div>
          </div>
          <button className="btn ikincil mini" onClick={() => void cikisYap()}>Çıkış</button>
        </div>
      </header>
      <main className="icerik">
        {sayfa === 'dashboard' && <Dashboard />}
        {sayfa === 'kaza' && <KazaBildirimi />}
        {sayfa === 'uygunsuzluk' && <Uygunsuzluklar />}
        {sayfa === 'egitim' && <Egitimler />}
        {sayfa === 'kullanicilar' && admin && <Kullanicilar />}
        {sayfa === 'ayarlar' && admin && <Ayarlar />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HataSiniri>
      <Uygulama />
    </HataSiniri>
  );
}
