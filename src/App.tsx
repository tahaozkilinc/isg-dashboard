import { useState, Component } from 'react';
import type { ReactNode } from 'react';
import { useDurum, useYetki, cikisYap, oturumuBaslat } from './store';
import { supabaseAyarliMi } from './supabase';
import { ROLLER } from './types';
import { Giris } from './pages/Giris';
import { Dashboard } from './pages/Dashboard';
import { VeriGirisi } from './pages/VeriGirisi';
import { Tanimlar } from './pages/Tanimlar';

type SayfaId = 'dashboard' | 'veri' | 'tanimlar';

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

function Mesaj({ baslik, metin, cikis, yenile }: { baslik: string; metin: string; cikis?: boolean; yenile?: boolean }) {
  return (
    <div className="tam-sayfa">
      <div className="kart giris-kart">
        <h3>{baslik}</h3>
        <p style={{ color: 'var(--ink-2)' }}>{metin}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {yenile && <button className="btn" onClick={() => location.reload()}>Tekrar Dene</button>}
          {cikis && <button className="btn ikincil" onClick={() => void cikisYap()}>Çıkış Yap</button>}
        </div>
      </div>
    </div>
  );
}

oturumuBaslat();

function Uygulama() {
  const d = useDurum();
  const { veriGirebilir, tanimlayabilir } = useYetki();
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
  if (!d.oturum) return <Giris />;
  if (d.hata && !d.rol) return <Mesaj baslik="Bağlantı hatası" metin={d.hata} cikis yenile />;
  if (d.rol === 'tanimsiz') {
    return <Mesaj baslik="Hesabınız tanımlı değil" metin={`${d.oturum.eposta} adresi sistemde tanımlı değil. Erişim için sistem yöneticinizden sizi Tanımlar sayfasından eklemesini isteyin.`} cikis />;
  }
  if (d.rol === 'pasif') {
    return <Mesaj baslik="Erişim kapalı" metin="Hesabınızın erişimi kapatılmış. Gerekirse sistem yöneticisiyle görüşün." cikis />;
  }
  if (!d.veriYuklendi) {
    return <Mesaj baslik="Veriler yükleniyor…" metin={d.hata ?? 'Lütfen bekleyin.'} cikis={Boolean(d.hata)} />;
  }

  const firma = d.ayarlar.firmaAdi;
  const basHarfler = firma.split(/\s+/).map((k) => k[0]).join('').slice(0, 2).toLocaleUpperCase('tr');

  const sekmeler: { id: SayfaId; ad: string }[] = [
    { id: 'dashboard', ad: 'Dashboard' },
    ...(veriGirebilir ? [{ id: 'veri' as const, ad: 'Aylık Veri Girişi' }] : []),
    ...(tanimlayabilir ? [{ id: 'tanimlar' as const, ad: 'Tanımlar' }] : []),
  ];
  const aktif = sekmeler.some((s) => s.id === sayfa) ? sayfa : 'dashboard';

  return (
    <div className="app">
      <header className="topbar">
        <div className="marka">
          <div className="logo" aria-hidden>{basHarfler || 'İG'}</div>
          <div>
            <h1>{firma}</h1>
            <div className="alt">İSG Yönetim Sistemi</div>
          </div>
        </div>
        <nav className="sekmeler" aria-label="Sayfalar">
          {sekmeler.map((s) => (
            <button key={s.id} className={`sekme ${aktif === s.id ? 'aktif' : ''}`} onClick={() => setSayfa(s.id)}>
              {s.ad}
            </button>
          ))}
        </nav>
        <div className="kullanici-kutu">
          <div>
            <div className="kullanici-ad">{d.adSoyad || d.oturum.eposta}</div>
            <div className="alt">{ROLLER.find((r) => r.rol === d.rol)?.ad}</div>
          </div>
          <button className="btn ikincil mini" onClick={() => void cikisYap()}>Çıkış</button>
        </div>
      </header>
      <main className="icerik">
        {aktif === 'dashboard' && <Dashboard />}
        {aktif === 'veri' && veriGirebilir && <VeriGirisi />}
        {aktif === 'tanimlar' && tanimlayabilir && <Tanimlar />}
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
