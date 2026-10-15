import { AYLAR, AYLAR_KISA } from '../types';

export interface Seri { anahtar: string; ad: string; renk: string }
export type AylikSatir = { ay: string; tamAd: string } & Record<string, number | string | null>;

/** 12 aylık dizileri grafik satırlarına çevirir */
export function aylikSatirlar(seriler: Record<string, (number | null)[]>): AylikSatir[] {
  return AYLAR.map((tamAd, i) => {
    const s: AylikSatir = { ay: AYLAR_KISA[i], tamAd };
    for (const [k, dizi] of Object.entries(seriler)) s[k] = dizi[i];
    return s;
  });
}
