import { useSyncExternalStore } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine, Cell,
} from 'recharts';
import { sayiYaz } from '../gostergeler';
import type { AylikSatir, Seri } from './grafikVeri';

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
  void koyu;
  const stil = getComputedStyle(document.documentElement);
  const oku = (ad: string) => stil.getPropertyValue(ad).trim();
  return {
    ink: oku('--ink'), ink2: oku('--ink-2'), muted: oku('--muted'),
    grid: oku('--grid'), baseline: oku('--baseline'), surface: oku('--surface'),
    s: (n: number) => oku(`--s${n}`),
  };
}


interface TooltipVeri {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string; fill?: string; stroke?: string; payload?: Record<string, unknown> }[];
}

function IpucuKutusu({ active, payload, birim, ondalik, baslik }: TooltipVeri & { birim?: string; ondalik?: number; baslik?: (p: Record<string, unknown>) => string }) {
  if (!active || !payload?.length) return null;
  const ilk = payload[0].payload ?? {};
  return (
    <div className="viz-tooltip">
      <div className="baslik">{baslik ? baslik(ilk) : String(ilk.tamAd ?? ilk.etiket ?? '')}</div>
      {payload.filter((p) => p.value !== null && p.value !== undefined).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="bolge-nokta" style={{ background: p.color ?? p.fill ?? p.stroke }} />
          <span>{payload.length > 1 ? `${p.name}: ` : ''}<strong>{sayiYaz(p.value, ondalik ?? 0)}</strong>{birim ? ` ${birim}` : ''}</span>
        </div>
      ))}
    </div>
  );
}

function Lejant({ seriler }: { seriler: Seri[] }) {
  if (seriler.length < 2) return null;
  return (
    <div className="lejant">
      {seriler.map((s) => (
        <span key={s.anahtar} className="lejant-oge">
          <span className="bolge-nokta" style={{ background: s.renk }} />{s.ad}
        </span>
      ))}
    </div>
  );
}

/** Aylık sütun grafiği: tek seri, gruplu ya da yığılmış */
export function AylikSutun({
  veri, seriler, yigin = false, yukseklik = 210, birim, ondalik = 0, etiketGoster = true,
}: {
  veri: AylikSatir[]; seriler: Seri[]; yigin?: boolean; yukseklik?: number; birim?: string; ondalik?: number; etiketGoster?: boolean;
}) {
  const p = usePalet();
  const tekSeri = seriler.length === 1;
  const enAz = veri.some((r) => seriler.some((s) => r[s.anahtar] !== null && r[s.anahtar] !== undefined));
  if (!enAz) return <div className="bos-durum">Bu yıl için veri girilmemiş</div>;
  return (
    <div>
      <Lejant seriler={seriler} />
      <div style={{ width: '100%', height: yukseklik }}>
        <ResponsiveContainer>
          <BarChart data={veri} margin={{ left: -12, right: 4, top: 18, bottom: 0 }} barCategoryGap={yigin || tekSeri ? '28%' : '18%'}>
            <CartesianGrid vertical={false} stroke={p.grid} />
            <XAxis dataKey="ay" interval={0} tickLine={false} axisLine={{ stroke: p.baseline }} tick={{ fill: p.muted, fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: p.muted, fontSize: 11 }} tickFormatter={(v) => sayiYaz(v as number, 0)} />
            <Tooltip content={<IpucuKutusu birim={birim} ondalik={ondalik} />} cursor={{ fill: p.grid, opacity: 0.5 }} />
            {seriler.map((s, i) => (
              <Bar
                key={s.anahtar} dataKey={s.anahtar} name={s.ad} fill={s.renk}
                stackId={yigin ? 'y' : undefined}
                stroke={yigin ? p.surface : undefined} strokeWidth={yigin ? 2 : 0}
                radius={yigin ? (i === seriler.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
                maxBarSize={tekSeri || yigin ? 26 : 14} isAnimationActive={false}
              >
                {tekSeri && etiketGoster && (
                  <LabelList
                    dataKey={s.anahtar} position="top"
                    style={{ fill: p.ink2, fontSize: 11, fontWeight: 600 }}
                    formatter={(v) => (v === null || v === undefined ? '' : sayiYaz(Number(v), ondalik))}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Aylık çizgi grafiği, isteğe bağlı referans çizgisi (örn. önceki yıl ortalaması) */
export function AylikCizgi({
  veri, anahtar, ad, renk, referans, yukseklik = 210, ondalik = 1, birim, alan, tickSayisi = 5,
}: {
  veri: AylikSatir[]; anahtar: string; ad: string; renk: string; referans?: { deger: number; etiket: string };
  yukseklik?: number; ondalik?: number; birim?: string; alan?: [number, number]; tickSayisi?: number;
}) {
  const p = usePalet();
  if (!veri.some((r) => r[anahtar] !== null && r[anahtar] !== undefined)) return <div className="bos-durum">Bu yıl için veri girilmemiş</div>;
  return (
    <div style={{ width: '100%', height: yukseklik }}>
      <ResponsiveContainer>
        <LineChart data={veri} margin={{ left: -8, right: 12, top: 22, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={p.grid} />
          <XAxis dataKey="ay" interval={0} tickLine={false} axisLine={{ stroke: p.baseline }} tick={{ fill: p.muted, fontSize: 11 }} />
          <YAxis
            tickLine={false} axisLine={false} tick={{ fill: p.muted, fontSize: 11 }}
            domain={alan ?? ['auto', 'auto']} tickCount={tickSayisi} tickFormatter={(v) => sayiYaz(v as number, 0)}
          />
          <Tooltip content={<IpucuKutusu birim={birim} ondalik={ondalik} />} />
          {referans && (
            <ReferenceLine
              y={referans.deger} stroke={p.muted} strokeDasharray="5 4"
              label={{ value: referans.etiket, position: 'insideBottomRight', fill: p.ink2, fontSize: 11 }}
            />
          )}
          <Line
            type="monotone" dataKey={anahtar} name={ad} stroke={renk} strokeWidth={2}
            dot={{ r: 4, fill: renk, stroke: p.surface, strokeWidth: 2 }} activeDot={{ r: 5 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={anahtar} position="top" offset={9}
              style={{ fill: p.ink, fontSize: 11, fontWeight: 600 }}
              formatter={(v) => (v === null || v === undefined ? '' : sayiYaz(Number(v), ondalik))}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface YilNoktasi { etiket: string; deger: number | null; guncel?: boolean; not?: string }

/** Yıllara göre karşılaştırma sütunları; güncel yıl vurgulu, önceki yıllar nötr */
export function YilSutunlari({ veri, renk, yukseklik = 190, ondalik = 0, birim }: { veri: YilNoktasi[]; renk: string; yukseklik?: number; ondalik?: number; birim?: string }) {
  const p = usePalet();
  const gorunur = veri.filter((v) => v.deger !== null);
  if (gorunur.length === 0) return <div className="bos-durum">Veri yok</div>;
  return (
    <div style={{ width: '100%', height: yukseklik }}>
      <ResponsiveContainer>
        <BarChart data={veri} margin={{ left: -12, right: 4, top: 22, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={p.grid} />
          <XAxis dataKey="etiket" interval={0} tickLine={false} axisLine={{ stroke: p.baseline }} tick={{ fill: p.ink2, fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: p.muted, fontSize: 11 }} tickFormatter={(v) => sayiYaz(v as number, 0)} />
          <Tooltip content={<IpucuKutusu birim={birim} ondalik={ondalik} baslik={(r) => `${r.etiket}${r.not ? ` · ${r.not}` : ''}`} />} cursor={{ fill: p.grid, opacity: 0.5 }} />
          <Bar dataKey="deger" maxBarSize={44} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {veri.map((v, i) => <Cell key={i} fill={v.guncel ? renk : p.muted} />)}
            <LabelList dataKey="deger" position="top" style={{ fill: p.ink, fontSize: 12, fontWeight: 700 }}
              formatter={(v) => (v === null || v === undefined ? '' : sayiYaz(Number(v), ondalik))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
