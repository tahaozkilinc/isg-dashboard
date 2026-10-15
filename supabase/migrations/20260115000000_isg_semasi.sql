-- İSG Dashboard — veritabanı kurulumu (şema + yetkiler + Sunar Mısır 2024-2026 verileri)
-- Supabase panelinde SQL Editor'e yapıştırıp BİR KEZ çalıştırın. Tekrar çalıştırmak güvenlidir:
-- girdiğiniz verilerin üzerine yazmaz.
--
-- Roller:
--   admin    → yalnızca TANIMLAMA yapar (kullanıcı ve firma tanımları); kayıt girmez
--   uzman    → aylık verileri girer ve düzeltir
--   izleyici → yalnızca dashboard'u görür
--   pasif    → erişimi kapalı
-- Kullanıcı hesapları Supabase panelinde (Authentication → Users) açılır, rolleri uygulamadaki
-- Tanımlar sayfasından verilir. Kendi kendine kayıt YOKTUR.

-- ---------- Eski sürümden kalan nesneleri temizle (varsa) ----------
drop table if exists public.isg_kazalar cascade;
drop table if exists public.isg_uygunsuzluklar cascade;
drop table if exists public.isg_egitimler cascade;
drop table if exists public.isg_profiller cascade;
drop function if exists public.isg_profil_olustur(text);

-- ---------- Tablolar ----------
create table if not exists public.isg_kullanicilar (
  eposta text primary key check (eposta = lower(eposta)),
  ad_soyad text not null default '',
  rol text not null check (rol in ('admin', 'uzman', 'izleyici', 'pasif')),
  olusturma timestamptz not null default now()
);

create table if not exists public.isg_ayarlar (
  id smallint primary key default 1 check (id = 1),
  firma_adi text not null default 'FİRMA ADI'
);
alter table public.isg_ayarlar drop column if exists calisan_sayisi;
alter table public.isg_ayarlar drop column if exists yillik_calisan_gun;
alter table public.isg_ayarlar drop column if exists gunluk_saat;
insert into public.isg_ayarlar (id, firma_adi)
values (1, 'Sunar Mısır Ent. Tes. San. ve Tic. A.Ş.')
on conflict (id) do update set firma_adi = excluded.firma_adi
  where public.isg_ayarlar.firma_adi = 'FİRMA ADI';

-- ay = 1..12 → aylık değer, ay = 0 → o yılın toplamı/değeri (aylık dökümü olmayan geçmiş yıllar için)
create table if not exists public.isg_aylik_veri (
  yil smallint not null check (yil between 2000 and 2100),
  ay smallint not null check (ay between 0 and 12),
  kod text not null check (kod ~ '^[a-z_]{2,60}$'),
  deger numeric(14, 3) not null,
  guncelleyen uuid default auth.uid() references auth.users (id) on delete set null,
  guncelleme timestamptz not null default now(),
  primary key (yil, ay, kod)
);

-- ---------- Yetki fonksiyonları ----------
create or replace function public.isg_rol()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.isg_kullanicilar
  where eposta = lower((select auth.jwt() ->> 'email'))
$$;

-- Giriş yapan kişinin rolünü döndürür. Sistemde hiç yönetici yoksa ilk giriş yapan yönetici olur.
create or replace function public.isg_rolum()
returns table (o_eposta text, o_ad_soyad text, o_rol text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eposta text := lower((select auth.jwt() ->> 'email'));
begin
  if (select auth.uid()) is null or v_eposta is null then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('isg_rolum'));

  if not exists (select 1 from public.isg_kullanicilar a where a.rol = 'admin') then
    insert into public.isg_kullanicilar (eposta, ad_soyad, rol)
    values (v_eposta, '', 'admin')
    on conflict on constraint isg_kullanicilar_pkey do update set rol = 'admin';
  end if;

  return query
    select k.eposta, k.ad_soyad, k.rol from public.isg_kullanicilar k where k.eposta = v_eposta;
end;
$$;

-- Sistemde her zaman en az bir yönetici kalmasını garanti eder.
create or replace function public.isg_son_admin_korumasi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'admin'
     and (tg_op = 'DELETE' or new.rol <> 'admin')
     and not exists (select 1 from public.isg_kullanicilar where rol = 'admin' and eposta <> old.eposta) then
    raise exception 'Sistemdeki son yönetici kaldırılamaz';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists isg_son_admin_korumasi on public.isg_kullanicilar;
create trigger isg_son_admin_korumasi
  before update or delete on public.isg_kullanicilar
  for each row execute function public.isg_son_admin_korumasi();

revoke all on function public.isg_rol() from public, anon;
revoke all on function public.isg_rolum() from public, anon;
grant execute on function public.isg_rol() to authenticated;
grant execute on function public.isg_rolum() to authenticated;

-- ---------- Satır güvenliği (RLS) ----------
alter table public.isg_kullanicilar enable row level security;
alter table public.isg_ayarlar enable row level security;
alter table public.isg_aylik_veri enable row level security;

revoke all on public.isg_kullanicilar, public.isg_ayarlar, public.isg_aylik_veri from anon;

-- Kullanıcı tanımları: yalnızca yönetici görür ve değiştirir.
drop policy if exists isg_kullanici_hepsi on public.isg_kullanicilar;
create policy isg_kullanici_hepsi on public.isg_kullanicilar for all to authenticated
  using ((select public.isg_rol()) = 'admin')
  with check ((select public.isg_rol()) = 'admin');

-- Firma ayarı: onaylı herkes okur, yalnızca yönetici değiştirir.
drop policy if exists isg_ayar_oku on public.isg_ayarlar;
create policy isg_ayar_oku on public.isg_ayarlar for select to authenticated
  using ((select public.isg_rol()) in ('admin', 'uzman', 'izleyici'));

drop policy if exists isg_ayar_guncelle on public.isg_ayarlar;
create policy isg_ayar_guncelle on public.isg_ayarlar for update to authenticated
  using ((select public.isg_rol()) = 'admin')
  with check ((select public.isg_rol()) = 'admin');

-- Aylık veri: yönetici, uzman ve izleyici okur; yalnızca uzman girer/düzeltir/siler.
drop policy if exists isg_veri_oku on public.isg_aylik_veri;
create policy isg_veri_oku on public.isg_aylik_veri for select to authenticated
  using ((select public.isg_rol()) in ('admin', 'uzman', 'izleyici'));

drop policy if exists isg_veri_ekle on public.isg_aylik_veri;
create policy isg_veri_ekle on public.isg_aylik_veri for insert to authenticated
  with check ((select public.isg_rol()) = 'uzman');

drop policy if exists isg_veri_guncelle on public.isg_aylik_veri;
create policy isg_veri_guncelle on public.isg_aylik_veri for update to authenticated
  using ((select public.isg_rol()) = 'uzman')
  with check ((select public.isg_rol()) = 'uzman');

drop policy if exists isg_veri_sil on public.isg_aylik_veri;
create policy isg_veri_sil on public.isg_aylik_veri for delete to authenticated
  using ((select public.isg_rol()) = 'uzman');

-- ---------- Sunar Mısır verileri (Excel: "2026 İSG KPI Sunar") ----------
-- 2026: Ocak–Mayıs aylık değerler · 2025 ve 2024: yıllık toplamlar (ay = 0)
insert into public.isg_aylik_veri (yil, ay, kod, deger) values
  (2024, 0, 'agirlik_orani', 0.83),
  (2024, 0, 'diger_egitim_adam_saat', 2343),
  (2024, 0, 'diger_egitim_katilimci', 716),
  (2024, 0, 'gerceklesme_puani', 102),
  (2024, 0, 'gunluk_isbasi_iyilestirme', 2390),
  (2024, 0, 'ic_denetim_puani', 91),
  (2024, 0, 'ilk_ise_giris_egitim_saati', 1442),
  (2024, 0, 'is_izni', 3136),
  (2024, 0, 'ise_giris', 103),
  (2024, 0, 'iyilestirme_faaliyet', 179),
  (2024, 0, 'iyilestirme_gozlem', 112),
  (2024, 0, 'kayip_gun', 122),
  (2024, 0, 'kaza_beyaz', 0),
  (2024, 0, 'kaza_engelli', 2),
  (2024, 0, 'kaza_erkek', 22),
  (2024, 0, 'kaza_kadin', 0),
  (2024, 0, 'kaza_mavi', 22),
  (2024, 0, 'kaza_toplam', 22),
  (2024, 0, 'meslek_hastaligi_kayip_gun', 0),
  (2024, 0, 'ramak_kala', 56),
  (2024, 0, 'saglik_rapor_gun', 2630),
  (2024, 0, 'siklik_orani', 14.4),
  (2024, 0, 'son_kazadan_gecen_gun', 190),
  (2024, 0, 'yasanmayan_gun', 344),
  (2025, 0, 'agirlik_orani', 0.21),
  (2025, 0, 'diger_egitim_adam_saat', 5664),
  (2025, 0, 'diger_egitim_katilimci', 1151),
  (2025, 0, 'gerceklesme_puani', 102),
  (2025, 0, 'gunluk_isbasi_iyilestirme', 2450),
  (2025, 0, 'ic_denetim_puani', 84),
  (2025, 0, 'ilk_ise_giris_egitim_saati', 1260),
  (2025, 0, 'is_izni', 2424),
  (2025, 0, 'ise_giris', 90),
  (2025, 0, 'iyilestirme_faaliyet', 146),
  (2025, 0, 'iyilestirme_gozlem', 100),
  (2025, 0, 'kayip_gun', 35),
  (2025, 0, 'kaza_beyaz', 0),
  (2025, 0, 'kaza_engelli', 2),
  (2025, 0, 'kaza_erkek', 20),
  (2025, 0, 'kaza_kadin', 0),
  (2025, 0, 'kaza_mavi', 20),
  (2025, 0, 'kaza_toplam', 20),
  (2025, 0, 'meslek_hastaligi_kayip_gun', 0),
  (2025, 0, 'ramak_kala', 53),
  (2025, 0, 'saglik_rapor_gun', 2795),
  (2025, 0, 'siklik_orani', 13.1),
  (2025, 0, 'son_kazadan_gecen_gun', 269),
  (2025, 0, 'yasanmayan_gun', 345),
  (2026, 1, 'diger_egitim_adam_saat', 3796),
  (2026, 1, 'diger_egitim_katilimci', 320),
  (2026, 1, 'gerceklesme_puani', 101),
  (2026, 1, 'gunluk_isbasi_iyilestirme', 179),
  (2026, 1, 'ic_denetim_puani', 83.36),
  (2026, 1, 'ilk_ise_giris_egitim_saati', 164),
  (2026, 1, 'is_izni', 152),
  (2026, 1, 'ise_giris', 13),
  (2026, 1, 'iyilestirme_faaliyet', 10),
  (2026, 1, 'iyilestirme_gozlem', 7),
  (2026, 1, 'kayip_gun', 10),
  (2026, 1, 'kayip_gun_beyaz', 10),
  (2026, 1, 'kayip_gun_mavi', 0),
  (2026, 1, 'kaza_beyaz', 1),
  (2026, 1, 'kaza_engelli', 1),
  (2026, 1, 'kaza_erkek', 1),
  (2026, 1, 'kaza_gun_kayipli', 1),
  (2026, 1, 'kaza_gun_kayipsiz', 0),
  (2026, 1, 'kaza_kadin', 0),
  (2026, 1, 'kaza_mavi', 0),
  (2026, 1, 'kaza_toplam', 1),
  (2026, 1, 'meslek_hastaligi_kayip_gun', 0),
  (2026, 1, 'ramak_kala', 8),
  (2026, 1, 'saglik_rapor_gun', 198),
  (2026, 1, 'son_kazadan_gecen_gun', 8),
  (2026, 1, 'yasanmayan_gun', 30),
  (2026, 2, 'diger_egitim_adam_saat', 4),
  (2026, 2, 'diger_egitim_katilimci', 4),
  (2026, 2, 'gerceklesme_puani', 98),
  (2026, 2, 'gunluk_isbasi_iyilestirme', 168),
  (2026, 2, 'ic_denetim_puani', 84.42),
  (2026, 2, 'ilk_ise_giris_egitim_saati', 50),
  (2026, 2, 'is_izni', 116),
  (2026, 2, 'ise_giris', 5),
  (2026, 2, 'iyilestirme_faaliyet', 8),
  (2026, 2, 'iyilestirme_gozlem', 12),
  (2026, 2, 'kayip_gun', 8),
  (2026, 2, 'kayip_gun_beyaz', 0),
  (2026, 2, 'kayip_gun_mavi', 8),
  (2026, 2, 'kaza_beyaz', 0),
  (2026, 2, 'kaza_engelli', 0),
  (2026, 2, 'kaza_erkek', 2),
  (2026, 2, 'kaza_gun_kayipli', 2),
  (2026, 2, 'kaza_gun_kayipsiz', 0),
  (2026, 2, 'kaza_kadin', 0),
  (2026, 2, 'kaza_mavi', 2),
  (2026, 2, 'kaza_toplam', 2),
  (2026, 2, 'meslek_hastaligi_kayip_gun', 0),
  (2026, 2, 'ramak_kala', 4),
  (2026, 2, 'saglik_rapor_gun', 197),
  (2026, 2, 'son_kazadan_gecen_gun', 10),
  (2026, 2, 'yasanmayan_gun', 26),
  (2026, 3, 'diger_egitim_adam_saat', 205),
  (2026, 3, 'diger_egitim_katilimci', 71),
  (2026, 3, 'gerceklesme_puani', 103),
  (2026, 3, 'gunluk_isbasi_iyilestirme', 166),
  (2026, 3, 'ic_denetim_puani', 83.05),
  (2026, 3, 'ilk_ise_giris_egitim_saati', 70),
  (2026, 3, 'is_izni', 163),
  (2026, 3, 'ise_giris', 5),
  (2026, 3, 'iyilestirme_faaliyet', 15),
  (2026, 3, 'iyilestirme_gozlem', 10),
  (2026, 3, 'kayip_gun', 0),
  (2026, 3, 'kayip_gun_beyaz', 0),
  (2026, 3, 'kayip_gun_mavi', 0),
  (2026, 3, 'kaza_beyaz', 0),
  (2026, 3, 'kaza_engelli', 0),
  (2026, 3, 'kaza_erkek', 0),
  (2026, 3, 'kaza_gun_kayipli', 0),
  (2026, 3, 'kaza_gun_kayipsiz', 0),
  (2026, 3, 'kaza_kadin', 0),
  (2026, 3, 'kaza_mavi', 0),
  (2026, 3, 'kaza_toplam', 0),
  (2026, 3, 'meslek_hastaligi_kayip_gun', 0),
  (2026, 3, 'ramak_kala', 4),
  (2026, 3, 'saglik_rapor_gun', 126),
  (2026, 3, 'son_kazadan_gecen_gun', 42),
  (2026, 3, 'yasanmayan_gun', 31),
  (2026, 4, 'diger_egitim_adam_saat', 76),
  (2026, 4, 'diger_egitim_katilimci', 30),
  (2026, 4, 'gerceklesme_puani', 101),
  (2026, 4, 'gunluk_isbasi_iyilestirme', 198),
  (2026, 4, 'ic_denetim_puani', 83.36),
  (2026, 4, 'ilk_ise_giris_egitim_saati', 20),
  (2026, 4, 'is_izni', 180),
  (2026, 4, 'ise_giris', 2),
  (2026, 4, 'iyilestirme_faaliyet', 10),
  (2026, 4, 'iyilestirme_gozlem', 6),
  (2026, 4, 'kayip_gun', 9),
  (2026, 4, 'kayip_gun_beyaz', 0),
  (2026, 4, 'kayip_gun_mavi', 9),
  (2026, 4, 'kaza_beyaz', 0),
  (2026, 4, 'kaza_engelli', 0),
  (2026, 4, 'kaza_erkek', 1),
  (2026, 4, 'kaza_gun_kayipli', 1),
  (2026, 4, 'kaza_gun_kayipsiz', 0),
  (2026, 4, 'kaza_kadin', 0),
  (2026, 4, 'kaza_mavi', 1),
  (2026, 4, 'kaza_toplam', 1),
  (2026, 4, 'meslek_hastaligi_kayip_gun', 0),
  (2026, 4, 'ramak_kala', 7),
  (2026, 4, 'saglik_rapor_gun', 193),
  (2026, 4, 'son_kazadan_gecen_gun', 22),
  (2026, 4, 'yasanmayan_gun', 29),
  (2026, 5, 'diger_egitim_adam_saat', 88.5),
  (2026, 5, 'diger_egitim_katilimci', 43),
  (2026, 5, 'gerceklesme_puani', 100),
  (2026, 5, 'gunluk_isbasi_iyilestirme', 172),
  (2026, 5, 'ic_denetim_puani', 82.2),
  (2026, 5, 'ilk_ise_giris_egitim_saati', 56),
  (2026, 5, 'is_izni', 87),
  (2026, 5, 'ise_giris', 4),
  (2026, 5, 'iyilestirme_faaliyet', 7),
  (2026, 5, 'iyilestirme_gozlem', 6),
  (2026, 5, 'kayip_gun', 0),
  (2026, 5, 'kayip_gun_beyaz', 0),
  (2026, 5, 'kayip_gun_mavi', 0),
  (2026, 5, 'kaza_beyaz', 0),
  (2026, 5, 'kaza_engelli', 0),
  (2026, 5, 'kaza_erkek', 0),
  (2026, 5, 'kaza_gun_kayipli', 0),
  (2026, 5, 'kaza_gun_kayipsiz', 0),
  (2026, 5, 'kaza_kadin', 0),
  (2026, 5, 'kaza_mavi', 0),
  (2026, 5, 'kaza_toplam', 0),
  (2026, 5, 'meslek_hastaligi_kayip_gun', 0),
  (2026, 5, 'ramak_kala', 5),
  (2026, 5, 'saglik_rapor_gun', 118),
  (2026, 5, 'son_kazadan_gecen_gun', 53),
  (2026, 5, 'yasanmayan_gun', 31)
on conflict (yil, ay, kod) do nothing;

-- Supabase API'sinin yeni tabloları ve fonksiyonları hemen görmesi için önbelleği yenile
notify pgrst, 'reload schema';

-- Kurulum kontrolü: aşağıdaki sorgu 178 döndürmelidir
-- select count(*) from public.isg_aylik_veri;
