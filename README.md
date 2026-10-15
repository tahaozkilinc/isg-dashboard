# İSG Dashboard — Aylık İSG Göstergeleri

Sunar Mısır'ın Excel'de manuel tuttuğu **"Temel İş Güvenliği İstatistikleri"** tablosunun dijital karşılığı.
İSG uzmanı aylık göstergeleri girer; dashboard kazasız gün sayacı, ay ay kaza durumu, önceki yıl
karşılaştırmaları ve grafiklerle otomatik güncellenir.

## Kimler ne yapar

| Rol | Yetki |
|---|---|
| **Yönetici** | Yalnızca **tanımlama** yapar: kullanıcıları ve firma adını yönetir. Veri girmez. |
| **Yönetici + İSG Uzmanı** | Hem tanımlama yapar hem veri girer (tek kişilik kurulum için). İlk giriş yapan kişi bu rolü alır. |
| **İSG Uzmanı** | Yeni kazayı ve aylık göstergeleri girer, düzeltir. |
| **İzleyici** | Yalnızca dashboard'u görür. |
| **Pasif** | Erişimi kapalı. |

**Kayıt ol yoktur.** Yönetici, uygulamadaki **Tanımlar** sayfasından ad, e-posta, rol ve şifre belirleyerek
hesap açar; kullanıcı isterse **Profilim** sayfasından şifresini kendisi değiştirir. Yetkiler arayüzde değil
veritabanında (satır güvenliği / RLS) uygulanır.

## Sayfalar

- **Dashboard** — kazasız gün sayacı, ay ay kaza şeridi, 6 ana gösterge kartı (önceki yılla karşılaştırmalı),
  iş kazası/kayıp gün/risk bildirimi/denetim/eğitim grafikleri, yıllara göre karşılaştırma ve Excel'deki
  tablonun aynısı. Yazdır / PDF düğmesi vardır.
- **Yeni Kaza Girişi** (uzman) — tek kazanın bilgilerini (tarih, mavi/beyaz yaka, cinsiyet, engelli, kayıp gün)
  girin; ilgili ayın göstergeleri (kaza sayısı, kayıp gün, kazasız gün, son kazadan geçen gün) otomatik güncellenir.
  Kaydetmeden önce hangi değerlerin değişeceğini gösterir.
- **Aylık Veri Girişi** (uzman) — Excel gibi tablo: hücreye yaz, **Kaydet**. Tutarsız girişler için uyarı verir
  (örn. erkek + kadın ≠ toplam kaza).
- **Tanımlar** (yönetici) — firma adı, şifreli kullanıcı oluşturma, rol verme, şifre belirleme.
- **Profilim** (herkes) — kendi şifresini değiştirme.

## Kurulum

### 1) Veritabanı
Supabase panelinde **SQL Editor**'ü açıp `supabase/migrations/20260115000000_isg_semasi.sql` dosyasının
tamamını bir kez çalıştırın. Tablolar, yetkiler ve Excel'deki 2024–2026 verileri yüklenir. Tekrar
çalıştırmak güvenlidir; girdiğiniz verilerin üzerine yazmaz.

### 2) Kendi kendine kaydı kapatın
**Authentication → Sign In / Providers** bölümünde **"Allow new users to sign up"** seçeneğini
**kapatın**. Böylece hesabı yalnızca siz açabilirsiniz.

### 3) Kullanıcı işlevini kurun (şifreli hesap açmak için)
Şifreli hesap açmak gizli (service_role) anahtar gerektirir; bu yüzden küçük bir Supabase işlevi kullanılır.
Anahtar yalnızca Supabase sunucusunda kalır, uygulamaya ya da bu depoya yazılmaz.

1. Supabase panelinde **Edge Functions → Deploy a new function → Via Editor**.
2. Fonksiyon adı: **`kullanici-yonet`** (aynen böyle yazın).
3. Editördeki kodu silip `supabase/functions/kullanici-yonet/index.ts` dosyasının tamamını yapıştırın, **Deploy**'a basın.
   *Verify JWT* seçeneği açık (varsayılan) kalsın.

Bu adım yapılmazsa "Kullanıcıyı Oluştur" bir uyarı verir; yine de hesabı Supabase panelinden
(**Authentication → Users → Add user**, *Auto Confirm User* işaretli) açıp **Tanımlar**'dan yalnızca rol verebilirsiniz.

### 4) İlk giriş
**Authentication → Users → Add user** ile kendi hesabınızı açıp giriş yapın. İlk giriş yapan kişi otomatik
**Yönetici + İSG Uzmanı** olur. Sonra **Tanımlar → Yeni kullanıcı oluştur** ile diğer kişileri ad, e-posta,
rol ve şifreyle ekleyin. Tanımlanmamış bir hesap sisteme giremez.

### 5) Yayın (GitHub Pages)
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
