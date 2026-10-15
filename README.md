# İSG Dashboard — Aylık İSG Göstergeleri

Sunar Mısır'ın Excel'de manuel tuttuğu **"Temel İş Güvenliği İstatistikleri"** tablosunun dijital karşılığı.
İSG uzmanı aylık göstergeleri girer; dashboard kazasız gün sayacı, ay ay kaza durumu, önceki yıl
karşılaştırmaları ve grafiklerle otomatik güncellenir.

## Kimler ne yapar

| Rol | Yetki |
|---|---|
| **Yönetici** | Yalnızca **tanımlama** yapar: kullanıcıları ve firma adını yönetir. Veri girmez. |
| **İSG Uzmanı** | Aylık göstergeleri girer ve düzeltir. |
| **İzleyici** | Yalnızca dashboard'u görür. |
| **Pasif** | Erişimi kapalı. |

**Kayıt ol yoktur.** Hesapları Supabase panelinden yönetici açar, rolleri uygulamadaki **Tanımlar**
sayfasından verir. Yetkiler arayüzde değil veritabanında (satır güvenliği / RLS) uygulanır.

## Sayfalar

- **Dashboard** — kazasız gün sayacı, ay ay kaza şeridi, 6 ana gösterge kartı (önceki yılla karşılaştırmalı),
  iş kazası/kayıp gün/risk bildirimi/denetim/eğitim grafikleri, yıllara göre karşılaştırma ve Excel'deki
  tablonun aynısı. Yazdır / PDF düğmesi vardır.
- **Aylık Veri Girişi** (uzman) — Excel gibi tablo: hücreye yaz, **Kaydet**. Tutarsız girişler için uyarı verir
  (örn. erkek + kadın ≠ toplam kaza).
- **Tanımlar** (yönetici) — firma adı, kullanıcı tanımları ve roller.

## Kurulum

### 1) Veritabanı
Supabase panelinde **SQL Editor**'ü açıp `supabase/migrations/20260115000000_isg_semasi.sql` dosyasının
tamamını bir kez çalıştırın. Tablolar, yetkiler ve Excel'deki 2024–2026 verileri yüklenir. Tekrar
çalıştırmak güvenlidir; girdiğiniz verilerin üzerine yazmaz.

### 2) Kendi kendine kaydı kapatın
**Authentication → Sign In / Providers** bölümünde **"Allow new users to sign up"** seçeneğini
**kapatın**. Böylece hesabı yalnızca siz açabilirsiniz.

### 3) Hesapları açın
**Authentication → Users → Add user → Create new user**: e-posta ve şifre girin, **Auto Confirm User**
işaretli olsun.

- **İlk giriş yapan kişi otomatik Yönetici olur.** Önce kendi hesabınızı açıp bir kez giriş yapın.
- Diğer kişileri açtıktan sonra uygulamada **Tanımlar → Yeni kullanıcı tanımla** ile aynı e-postayı
  ve rolü girin. Tanımlanmamış bir hesap sisteme giremez.
- Yönetici veri giremediği için, veri girecek kişiyi **İSG Uzmanı** olarak tanımlayın.

### 4) Yayın (GitHub Pages)
1. Depo **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: `VITE_SUPABASE_ANON_KEY` ekleyin
   (Supabase → Project Settings → API'deki `anon`/publishable anahtar). `VITE_SUPABASE_URL` isteğe bağlıdır;
   verilmezse `.github/workflows/pages.yml` içindeki adres kullanılır.
3. Actions sekmesinde **GitHub Pages yayını**'nı çalıştırın. Sonraki her push otomatik yayınlanır.

`service_role` anahtarını **asla** koda, ortam değişkenine ya da bu depoya yazmayın.

## Yerel geliştirme

```bash
cp .env.example .env   # URL ve anon anahtarı yazın
npm install
npm run dev
npm run build
```

Teknolojiler: Vite · React · TypeScript · Recharts · Supabase (Postgres + Auth)

## Veri modeli

Tek tablo, esnek yapı: `isg_aylik_veri (yil, ay, kod, deger)`. `ay = 1..12` aylık değerdir, `ay = 0` aylık
dökümü olmayan geçmiş yılın toplamıdır (Excel'deki 2025 ve 2024 sütunları). Göstergelerin listesi ve
toplama kuralı (toplam / ortalama / son ay) `src/gostergeler.ts` içindedir.
