import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anahtar = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseAyarliMi = Boolean(url && anahtar);

// Ayar eksikse uygulama kurulum uyarısı gösterir; istemci hiç kullanılmaz.
export const supabase = createClient(url ?? 'http://localhost', anahtar ?? 'ayarlanmadi', {
  auth: { persistSession: true, autoRefreshToken: true },
});
