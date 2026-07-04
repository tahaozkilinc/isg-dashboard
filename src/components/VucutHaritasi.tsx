import type { YaralanmaBolgesi } from '../types';

// Yaralanma bölgesi haritası: Excel'deki insan silüeti görselinin dijital karşılığı.
// Renk tek renkli (mavi) sıralı skala — sayı arttıkça koyulaşır.
const SKALA = ['#9ec5f4', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b'];
const BOS = 'var(--grid)';

function renk(sayi: number, enCok: number): string {
  if (sayi <= 0) return BOS;
  const i = Math.min(SKALA.length - 1, Math.floor((sayi / Math.max(enCok, 1)) * SKALA.length));
  return SKALA[i];
}

// Silüet üzerindeki rozet konumları (viewBox 0 0 200 340)
const KONUMLAR: { bolge: YaralanmaBolgesi; x: number; y: number }[] = [
  { bolge: 'Baş - Boyun', x: 100, y: 30 },
  { bolge: 'Omuz - Kollar', x: 152, y: 108 },
  { bolge: 'Eller', x: 168, y: 186 },
  { bolge: 'Karın - Göğüs', x: 100, y: 112 },
  { bolge: 'Sırt - Bel', x: 48, y: 138 },
  { bolge: 'Kalça - Kasık', x: 100, y: 182 },
  { bolge: 'Bacak', x: 82, y: 245 },
  { bolge: 'Ayak', x: 118, y: 322 },
];

export function VucutHaritasi({ sayilar }: { sayilar: Map<YaralanmaBolgesi, number> }) {
  const gorunur = KONUMLAR.map((k) => ({ ...k, sayi: sayilar.get(k.bolge) ?? 0 }));
  const enCok = Math.max(...gorunur.map((g) => g.sayi), 1);
  const toplam = gorunur.reduce((t, g) => t + g.sayi, 0);
  if (toplam === 0) return <div className="bos-durum">Bu dönemde yaralanma kaydı yok</div>;

  return (
    <div className="vucut-sar">
      <svg viewBox="0 0 200 340" width="180" height="306" role="img" aria-label="Yaralanma bölgesi vücut haritası">
        <g fill="none" stroke="var(--baseline)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* baş ve boyun */}
          <circle cx="100" cy="28" r="18" />
          <path d="M93 45 v8 M107 45 v8" />
          {/* gövde */}
          <path d="M70 58 q30 -8 60 0 q6 2 8 10 l6 44 q1 8 -6 10 l-8 2 -2 42 q-14 8 -56 0 l-2 -42 -8 -2 q-7 -2 -6 -10 l6 -44 q2 -8 8 -10 z" />
          {/* kollar */}
          <path d="M62 70 q-10 24 -12 52 l-4 44 q6 6 12 2 l8 -42" />
          <path d="M138 70 q10 24 12 52 l4 44 q-6 6 -12 2 l-8 -42" />
          {/* eller */}
          <circle cx="44" cy="176" r="7" />
          <circle cx="156" cy="176" r="7" />
          {/* bacaklar */}
          <path d="M74 168 l-2 74 4 68 q8 5 14 0 l6 -66 h8 l6 66 q8 5 14 0 l4 -68 -2 -74" />
          {/* ayaklar */}
          <path d="M76 310 q-2 10 -12 12 q-4 4 4 6 h16 q4 -2 2 -8" />
          <path d="M124 310 q2 10 12 12 q4 4 -4 6 h-16 q-4 -2 -2 -8" />
        </g>
        {gorunur.filter((g) => g.sayi > 0).map((g) => (
          <g key={g.bolge}>
            <circle cx={g.x} cy={g.y} r="13" fill={renk(g.sayi, enCok)} stroke="var(--surface)" strokeWidth="2" />
            <text
              x={g.x} y={g.y + 4} textAnchor="middle"
              style={{ fontSize: 12, fontWeight: 700, fill: '#fff' }}
            >
              {g.sayi}
            </text>
          </g>
        ))}
      </svg>
      <ul className="bolge-listesi" style={{ minWidth: 150 }}>
        {gorunur.map((g) => (
          <li key={g.bolge} style={{ opacity: g.sayi > 0 ? 1 : 0.45 }}>
            <span className="bolge-nokta" style={{ background: renk(g.sayi, enCok) }} />
            <span className="isim">{g.bolge}</span>
            <span className="adet">{g.sayi}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
