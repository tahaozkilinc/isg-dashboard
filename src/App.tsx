import { useState } from 'react';
import { useIsgVeri } from './store';
import { Dashboard } from './pages/Dashboard';
import { KazaBildirimi } from './pages/KazaBildirimi';
import { Uygunsuzluklar } from './pages/Uygunsuzluklar';
import { Egitimler } from './pages/Egitimler';
import { Ayarlar } from './pages/Ayarlar';

const SAYFALAR = [
  { id: 'dashboard', ad: 'Dashboard' },
  { id: 'kaza', ad: 'Kaza Bildirimi' },
  { id: 'uygunsuzluk', ad: 'Uygunsuzluklar' },
  { id: 'egitim', ad: 'Eğitimler' },
  { id: 'ayarlar', ad: 'Ayarlar' },
] as const;

type SayfaId = (typeof SAYFALAR)[number]['id'];

export default function App() {
  const veri = useIsgVeri();
  const [sayfa, setSayfa] = useState<SayfaId>('dashboard');

  const basHarfler = veri.ayarlar.firmaAdi
    .split(/\s+/)
    .map((k) => k[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('tr');

  return (
    <div className="app">
      <header className="topbar">
        <div className="marka">
          <div className="logo" aria-hidden>{basHarfler || 'İG'}</div>
          <div>
            <h1>{veri.ayarlar.firmaAdi}</h1>
            <div className="alt">İSG Yönetim Sistemi — Aylık KPI Raporu</div>
          </div>
        </div>
        <nav className="sekmeler" aria-label="Sayfalar">
          {SAYFALAR.map((s) => (
            <button
              key={s.id}
              className={`sekme ${sayfa === s.id ? 'aktif' : ''}`}
              onClick={() => setSayfa(s.id)}
            >
              {s.ad}
            </button>
          ))}
        </nav>
      </header>
      <main className="icerik">
        {sayfa === 'dashboard' && <Dashboard />}
        {sayfa === 'kaza' && <KazaBildirimi />}
        {sayfa === 'uygunsuzluk' && <Uygunsuzluklar />}
        {sayfa === 'egitim' && <Egitimler />}
        {sayfa === 'ayarlar' && <Ayarlar />}
      </main>
    </div>
  );
}
