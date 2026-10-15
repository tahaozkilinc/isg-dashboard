-- İSG Dashboard şeması. Tüm nesneler isg_ önekli; başka sistemlerle aynı projede de çakışmaz.
-- Supabase panelinde SQL Editor'e yapıştırıp bir kez çalıştırın.

-- ---------- Kullanıcı profilleri ve roller ----------
-- Roller: admin (her şey), uzman (kayıt ekler/düzenler), izleyici (yalnızca okur),
--         beklemede (yönetici onayı bekler), pasif (erişimi kapatılmış)
create table if not exists public.isg_profiller (
  id uuid primary key references auth.users (id) on delete cascade,
  eposta text,
  ad_soyad text not null default '',
  rol text not null default 'beklemede'
    check (rol in ('admin', 'uzman', 'izleyici', 'beklemede', 'pasif')),
  olusturma timestamptz not null default now()
);

-- ---------- Firma / KPI ayarları (tek satır) ----------
create table if not exists public.isg_ayarlar (
  id smallint primary key default 1 check (id = 1),
  firma_adi text not null default 'FİRMA ADI',
  calisan_sayisi integer not null default 0 check (calisan_sayisi >= 0),
  yillik_calisan_gun integer not null default 295 check (yillik_calisan_gun between 0 and 366),
  gunluk_saat numeric(4, 2) not null default 7.5 check (gunluk_saat > 0 and gunluk_saat <= 24)
);
insert into public.isg_ayarlar (id) values (1) on conflict (id) do nothing;

-- ---------- Kayıt tabloları ----------
create table if not exists public.isg_kazalar (
  id uuid primary key default gen_random_uuid(),
  tarih date not null,
  ad_soyad text not null default '',
  bolum text not null default '',
  tur text not null check (tur in (
    'İlk Yardım', 'Tıbbi Müdahaleli Kaza', 'İş Günü Kayıplı Kaza',
    'Maddi Hasarlı Kaza', 'Ölümlü Kaza', 'Kısıtlı İş Görememezlik'
  )),
  cesit text not null,
  kok_sebep text not null,
  yaralanma_bolgesi text not null,
  kayip_gun integer not null default 0 check (kayip_gun between 0 and 3650),
  aciklama text not null default '',
  olusturan uuid default auth.uid() references auth.users (id) on delete set null,
  olusturma timestamptz not null default now()
);
create index if not exists isg_kazalar_tarih_idx on public.isg_kazalar (tarih);

create table if not exists public.isg_uygunsuzluklar (
  id uuid primary key default gen_random_uuid(),
  tarih date not null,
  baslik text not null,
  kok_sebep text not null,
  durum text not null default 'AÇIK' check (durum in ('AÇIK', 'KAPALI')),
  olusturan uuid default auth.uid() references auth.users (id) on delete set null,
  olusturma timestamptz not null default now()
);
create index if not exists isg_uygunsuzluklar_tarih_idx on public.isg_uygunsuzluklar (tarih);

create table if not exists public.isg_egitimler (
  id uuid primary key default gen_random_uuid(),
  tarih date not null,
  konu text not null,
  katilimci integer not null default 0 check (katilimci >= 0),
  olusturan uuid default auth.uid() references auth.users (id) on delete set null,
  olusturma timestamptz not null default now()
);
create index if not exists isg_egitimler_tarih_idx on public.isg_egitimler (tarih);

-- ---------- Yardımcı fonksiyonlar ----------
create or replace function public.isg_rol()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.isg_profiller where id = (select auth.uid())
$$;

-- İlk giriş yapan kullanıcı admin olur; sonrakiler yönetici onayı bekler.
create or replace function public.isg_profil_olustur(p_ad text)
returns public.isg_profiller
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profil public.isg_profiller;
  v_rol text;
begin
  if (select auth.uid()) is null then
    raise exception 'Oturum gerekli';
  end if;

  perform pg_advisory_xact_lock(hashtext('isg_profil_olustur'));

  select * into v_profil from public.isg_profiller where id = (select auth.uid());
  if found then
    return v_profil;
  end if;

  if exists (select 1 from public.isg_profiller where rol = 'admin') then
    v_rol := 'beklemede';
  else
    v_rol := 'admin';
  end if;

  insert into public.isg_profiller (id, eposta, ad_soyad, rol)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), coalesce(left(p_ad, 120), ''), v_rol)
  returning * into v_profil;

  return v_profil;
end;
$$;

-- Sistemde en az bir admin kalmasını garanti eder.
create or replace function public.isg_son_admin_korumasi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'admin'
     and (tg_op = 'DELETE' or new.rol <> 'admin')
     and not exists (select 1 from public.isg_profiller where rol = 'admin' and id <> old.id) then
    raise exception 'Sistemdeki son yönetici kaldırılamaz';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists isg_son_admin_korumasi on public.isg_profiller;
create trigger isg_son_admin_korumasi
  before update or delete on public.isg_profiller
  for each row execute function public.isg_son_admin_korumasi();

revoke all on function public.isg_rol() from public, anon;
revoke all on function public.isg_profil_olustur(text) from public, anon;
grant execute on function public.isg_rol() to authenticated;
grant execute on function public.isg_profil_olustur(text) to authenticated;

-- ---------- Satır güvenliği (RLS) ----------
alter table public.isg_profiller enable row level security;
alter table public.isg_ayarlar enable row level security;
alter table public.isg_kazalar enable row level security;
alter table public.isg_uygunsuzluklar enable row level security;
alter table public.isg_egitimler enable row level security;

revoke all on public.isg_profiller, public.isg_ayarlar, public.isg_kazalar,
  public.isg_uygunsuzluklar, public.isg_egitimler from anon;

-- Profiller: herkes kendi satırını, admin hepsini görür; rolü yalnızca admin değiştirir.
drop policy if exists isg_profil_oku on public.isg_profiller;
create policy isg_profil_oku on public.isg_profiller for select to authenticated
  using (id = (select auth.uid()) or (select public.isg_rol()) = 'admin');

drop policy if exists isg_profil_guncelle on public.isg_profiller;
create policy isg_profil_guncelle on public.isg_profiller for update to authenticated
  using ((select public.isg_rol()) = 'admin')
  with check ((select public.isg_rol()) = 'admin');

-- Ayarlar: onaylı kullanıcılar okur, admin günceller.
drop policy if exists isg_ayar_oku on public.isg_ayarlar;
create policy isg_ayar_oku on public.isg_ayarlar for select to authenticated
  using ((select public.isg_rol()) in ('admin', 'uzman', 'izleyici'));

drop policy if exists isg_ayar_guncelle on public.isg_ayarlar;
create policy isg_ayar_guncelle on public.isg_ayarlar for update to authenticated
  using ((select public.isg_rol()) = 'admin')
  with check ((select public.isg_rol()) = 'admin');

-- Kayıt tabloları: admin/uzman/izleyici okur; admin/uzman ekler ve düzenler; yalnızca admin siler.
do $$
declare
  t text;
begin
  foreach t in array array['isg_kazalar', 'isg_uygunsuzluklar', 'isg_egitimler'] loop
    execute format('drop policy if exists %I on public.%I', t || '_oku', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select public.isg_rol()) in (''admin'', ''uzman'', ''izleyici''))', t || '_oku', t);

    execute format('drop policy if exists %I on public.%I', t || '_ekle', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.isg_rol()) in (''admin'', ''uzman''))', t || '_ekle', t);

    execute format('drop policy if exists %I on public.%I', t || '_guncelle', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.isg_rol()) in (''admin'', ''uzman'')) with check ((select public.isg_rol()) in (''admin'', ''uzman''))', t || '_guncelle', t);

    execute format('drop policy if exists %I on public.%I', t || '_sil', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.isg_rol()) = ''admin'')', t || '_sil', t);
  end loop;
end $$;
