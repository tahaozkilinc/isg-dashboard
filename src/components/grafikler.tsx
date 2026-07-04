import { useSyncExternalStore } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';

// Renkler CSS değişkenlerinden okunur; koyu/açık tema değişince grafikler de güncellenir.
const koyuMedya = window.matchMedia('(prefers-color-scheme: dark)');

function usePalet() {
  const koyu = useSyncExternalStore(
    (cb) => {
      koyuMedya.addEventListener('change', cb);
      return () => koyuMedya.removeEventListener('change', cb);
    },
    () => koyuMedya.matches,
  );
  const stil = getComputedStyle(document.documentElement);
  const oku = (ad: string) => stil.getPropertyValue(ad).trim();
  void koyu;
  return {
    seriler: ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'].map(oku),
    ink: oku('--ink'),
    ink2: oku('--ink-2'),
    muted: oku('--muted'),
    grid: oku('--grid'),
    baseline: oku('--baseline'),
    surface: oku('--surface'),
  };
}

interface Dilim { ad: string; sayi: number }

function VizTooltip({ active, payload }: { active?: boolean; payload?: { name?: string; value?: number; payload?: Dilim & { ay?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const ad = p.payload?.ad ?? p.payload?.ay ?? p.name;
  return (
    <div className="viz-tooltip">
      <div className="baslik">{ad}</div>
      <div>{p.value} kayıt</div>
    </div>
  );
}

/** Halka grafik + yanında sayılarıyla renk lejantı (doğrudan etiket kuralı). */
export function HalkaGrafik({ veri, renkSirasi }: { veri: Dilim[]; renkSirasi?: string[] }) {
  const palet = usePalet();
  const renkler = renkSirasi ?? palet.seriler;
  const toplam = veri.reduce((t, d) => t + d.sayi, 0);
  if (toplam === 0) return <div className="bos-durum">Bu dönemde kayıt yok</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ width: 170, height: 170, position: 'relative', flex: 'none' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={veri} dataKey="sayi" nameKey="ad"
              innerRadius="62%" outerRadius="100%"
              paddingAngle={2} stroke={palet.surface} strokeWidth={2}
              isAnimationActive={false}
            >
              {veri.map((_, i) => (
                <Cell key={i} fill={renkler[i % renkler.length]} />
              ))}
            </Pie>
            <Tooltip content={<VizTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          pointerEvents: 'none', flexDirection: 'column',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{toplam}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>TOPLAM</div>
          </div>
        </div>
      </div>
      <ul className="bolge-listesi" style={{ flex: 1, minWidth: 160 }}>
        {veri.map((d, i) => (
          <li key={d.ad}>
            <span className="bolge-nokta" style={{ background: renkler[i % renkler.length] }} />
            <span className="isim">{d.ad}</span>
            <span className="adet">{d.sayi}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Yatay çubuk grafik — kategori adları solda, değer etiketi çubuğun ucunda. */
export function YatayBar({ veri, renk, enCok = 10 }: { veri: Dilim[]; renk?: string; enCok?: number }) {
  const palet = usePalet();
  const kesit = veri.slice(0, enCok);
  if (kesit.length === 0) return <div className="bos-durum">Bu dönemde kayıt yok</div>;
  const yukseklik = Math.max(140, kesit.length * 32 + 20);
  return (
    <div style={{ width: '100%', height: yukseklik }}>
      <ResponsiveContainer>
        <BarChart data={kesit} layout="vertical" margin={{ left: 8, right: 34, top: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category" dataKey="ad" width={190}
            tickLine={false} axisLine={false}
            tick={{ fill: palet.ink2, fontSize: 12 }}
          />
          <Tooltip content={<VizTooltip />} cursor={{ fill: palet.grid, opacity: 0.5 }} />
          <Bar dataKey="sayi" fill={renk ?? palet.seriler[0]} barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="sayi" position="right" style={{ fill: palet.ink, fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Aylara göre dikey çubuk grafik. */
export function AylikBar({ veri }: { veri: { ay: string; sayi: number }[] }) {
  const palet = usePalet();
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={veri} margin={{ left: -14, right: 8, top: 18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={palet.grid} />
          <XAxis
            dataKey="ay" tickLine={false} axisLine={{ stroke: palet.baseline }}
            tick={{ fill: palet.muted, fontSize: 11 }}
            tickFormatter={(a: string) => a.slice(0, 3)}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: palet.muted, fontSize: 11 }} />
          <Tooltip content={<VizTooltip />} cursor={{ fill: palet.grid, opacity: 0.5 }} />
          <Bar dataKey="sayi" fill={palet.seriler[0]} barSize={22} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="sayi" position="top"
              style={{ fill: palet.ink2, fontSize: 11, fontWeight: 600 }}
              formatter={(v) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
