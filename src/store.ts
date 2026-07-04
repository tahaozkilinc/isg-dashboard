import { useSyncExternalStore } from 'react';
import type { IsgVeri, Kaza, Uygunsuzluk, Egitim, Ayarlar } from './types';
import { VARSAYILAN_AYARLAR } from './types';

// Veriler tarayıcının yerel deposunda (localStorage) tutulur.
// İleride Supabase gibi bir veritabanına geçiş için tek değişmesi gereken katman burasıdır.
const STORAGE_KEY = 'isg-dashboard-veri';

function bosVeri(): IsgVeri {
  return { kazalar: [], uygunsuzluklar: [], egitimler: [], ayarlar: { ...VARSAYILAN_AYARLAR } };
}

function yukle(): IsgVeri {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bosVeri();
    const v = JSON.parse(raw) as Partial<IsgVeri>;
    return {
      kazalar: v.kazalar ?? [],
      uygunsuzluklar: v.uygunsuzluklar ?? [],
      egitimler: v.egitimler ?? [],
      ayarlar: { ...VARSAYILAN_AYARLAR, ...v.ayarlar },
    };
  } catch {
    return bosVeri();
  }
}

let veri: IsgVeri = yukle();
const dinleyiciler = new Set<() => void>();

function kaydet(yeni: IsgVeri) {
  veri = yeni;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veri));
  dinleyiciler.forEach((d) => d());
}

export function useIsgVeri(): IsgVeri {
  return useSyncExternalStore(
    (cb) => {
      dinleyiciler.add(cb);
      return () => dinleyiciler.delete(cb);
    },
    () => veri,
  );
}

export function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const eylemler = {
  kazaEkle(k: Kaza) {
    kaydet({ ...veri, kazalar: [...veri.kazalar, k] });
  },
  kazaSil(id: string) {
    kaydet({ ...veri, kazalar: veri.kazalar.filter((k) => k.id !== id) });
  },
  uygunsuzlukEkle(u: Uygunsuzluk) {
    kaydet({ ...veri, uygunsuzluklar: [...veri.uygunsuzluklar, u] });
  },
  uygunsuzlukDurumDegistir(id: string) {
    kaydet({
      ...veri,
      uygunsuzluklar: veri.uygunsuzluklar.map((u) =>
        u.id === id ? { ...u, durum: u.durum === 'AÇIK' ? 'KAPALI' : 'AÇIK' } : u,
      ),
    });
  },
  uygunsuzlukSil(id: string) {
    kaydet({ ...veri, uygunsuzluklar: veri.uygunsuzluklar.filter((u) => u.id !== id) });
  },
  egitimEkle(e: Egitim) {
    kaydet({ ...veri, egitimler: [...veri.egitimler, e] });
  },
  egitimSil(id: string) {
    kaydet({ ...veri, egitimler: veri.egitimler.filter((e) => e.id !== id) });
  },
  ayarlarGuncelle(a: Ayarlar) {
    kaydet({ ...veri, ayarlar: a });
  },
  tumVeriyiYukle(v: IsgVeri) {
    kaydet(v);
  },
  tumVeriyiSil() {
    kaydet(bosVeri());
  },
};
