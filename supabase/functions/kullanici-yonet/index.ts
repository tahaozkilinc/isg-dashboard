// Supabase Edge Function: kullanici-yonet
// Yönetici, uygulamadan ad + şifre ile kullanıcı hesabı açar veya bir kullanıcının şifresini yeniler.
// Hesap açmak gizli (service_role) anahtar gerektirir; bu anahtar yalnızca burada, Supabase sunucusunda kullanılır.
// Çağıran kişinin yönetici olup olmadığı veritabanından doğrulanır.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { ...cors, 'Content-Type': 'application/json' } });

const ROLLER = ['admin', 'admin_uzman', 'uzman', 'izleyici'];
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (istek.method !== 'POST') return json({ hata: 'Yalnızca POST desteklenir.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const servis = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Çağıran kim?
  const kullaniciIstemci = createClient(url, anon, {
    global: { headers: { Authorization: istek.headers.get('Authorization') ?? '' } },
  });
  const { data: oturum, error: oturumHata } = await kullaniciIstemci.auth.getUser();
  const cagiranEposta = oturum?.user?.email?.toLowerCase();
  if (oturumHata || !cagiranEposta) return json({ hata: 'Oturum doğrulanamadı. Yeniden giriş yapın.' }, 401);

  // 2) Yönetici mi?
  const yonetici = createClient(url, servis, { auth: { persistSession: false } });
  const { data: kayit } = await yonetici.from('isg_kullanicilar').select('rol').eq('eposta', cagiranEposta).maybeSingle();
  if (!kayit || !['admin', 'admin_uzman'].includes(kayit.rol)) {
    return json({ hata: 'Bu işlem için yönetici olmanız gerekir.' }, 403);
  }

  let govde: { islem?: string; eposta?: string; sifre?: string; adSoyad?: string; rol?: string };
  try { govde = await istek.json(); } catch { return json({ hata: 'Geçersiz istek.' }, 400); }
  const eposta = String(govde.eposta ?? '').trim().toLowerCase();
  const sifre = String(govde.sifre ?? '');

  if (!EPOSTA.test(eposta)) return json({ hata: 'Geçerli bir e-posta girin.' }, 400);
  if (sifre.length < 8) return json({ hata: 'Şifre en az 8 karakter olmalı.' }, 400);

  // Hesap açma
  if (govde.islem === 'olustur') {
    const rol = String(govde.rol ?? '');
    if (!ROLLER.includes(rol)) return json({ hata: 'Geçersiz rol.' }, 400);
    const adSoyad = String(govde.adSoyad ?? '').trim().slice(0, 120);

    const { error } = await yonetici.auth.admin.createUser({
      email: eposta, password: sifre, email_confirm: true, user_metadata: { ad_soyad: adSoyad },
    });
    if (error) {
      const zaten = /already|registered|exists/i.test(error.message);
      return json({ hata: zaten ? 'Bu e-posta ile zaten bir hesap var. Şifre belirle düğmesini kullanın.' : error.message }, zaten ? 409 : 400);
    }
    const { error: tanimHata } = await yonetici.from('isg_kullanicilar')
      .upsert({ eposta, ad_soyad: adSoyad, rol }, { onConflict: 'eposta' });
    if (tanimHata) return json({ hata: `Hesap açıldı ama rol tanımlanamadı: ${tanimHata.message}` }, 500);
    return json({ tamam: true });
  }

  // Şifre yenileme
  if (govde.islem === 'sifre') {
    let sayfa = 1;
    let hedefId: string | null = null;
    while (!hedefId) {
      const { data, error } = await yonetici.auth.admin.listUsers({ page: sayfa, perPage: 1000 });
      if (error) return json({ hata: error.message }, 500);
      hedefId = data.users.find((k) => k.email?.toLowerCase() === eposta)?.id ?? null;
      if (data.users.length < 1000) break;
      sayfa++;
    }
    if (!hedefId) return json({ hata: 'Bu e-posta ile bir hesap bulunamadı. Önce hesabı oluşturun.' }, 404);
    const { error } = await yonetici.auth.admin.updateUserById(hedefId, { password: sifre });
    if (error) return json({ hata: error.message }, 400);
    return json({ tamam: true });
  }

  return json({ hata: 'Bilinmeyen işlem.' }, 400);
});
