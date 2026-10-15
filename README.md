# İSG Dashboard — Aylık KPI Raporu

İş Sağlığı ve Güvenliği (İSG) evraklarını dijital ortama taşıyan web uygulaması.
Excel'de manuel tutulan **"Aylık İSG KPI Raporu"** dosyasının birebir dijital karşılığıdır:
iş kazası bildirimleri girilir, ana dashboard'da otomatik olarak raporlanır.

## Özellikler

- **Dashboard** — Yönetici özeti KPI kartları (kaza/olay sayısı, ölümlü kaza, gün kayıplı
  kaza, kayıp iş günü, kaza sıklık/ağırlık hızı, uygunsuzluk ve eğitim istatistikleri),
  kaza türleri halka grafiği, yaralanma bölgesi vücut haritası, kaza/olay çeşidi ve kök
  sebep grafikleri, aylara göre kaza dağılımı. Yıl/ay dönem filtresi ve koyu tema desteği.
- **Kaza Bildirimi** — İş kazası/olay giriş formu (tarih, kazazede, bölüm, kaza türü,
  çeşidi, kök sebep, yaralanma bölgesi, kayıp iş günü, açıklama) ve kayıt listesi.
- **Uygunsuzluklar** — Açık/kapalı durum takibi ile uygunsuzluk kayıtları.
- **Eğitimler** — İSG eğitim konuları ve katılımcı sayıları.
- **Kullanıcılar** (yönetici) — Kayıt olanlara rol verme, erişimi kapatma.
- **Ayarlar** (yönetici) — Firma adı ve KPI parametreleri (çalışan sayısı, yıllık çalışılan gün,
  günlük çalışma saati).

## KPI Formülleri (Excel ile aynı)

- Adam/Gün = çalışan sayısı × yıllık çalışılan gün
- Adam/Saat = Adam/Gün × günlük çalışma saati
- Kaza Sıklık Hızı = kaza sayısı × 1.000.000 / Adam-Saat
- Kaza Ağırlık Hızı = kayıp iş günü × 1.000 / Adam-Gün

## Kullanıcılar ve Roller

Giriş Supabase Auth (e-posta + şifre) ile yapılır. Roller veritabanında satır güvenliği (RLS)
ile korunur; arayüzdeki gizleme yalnızca kolaylıktır, asıl kontrol sunucudadır.

| Rol | Yetki |
|---|---|
| Yönetici | Her şeyi görür, ekler, siler; kullanıcı rollerini ve ayarları yönetir |
| İSG Uzmanı | Kaza/uygunsuzluk/eğitim kaydı ekler ve günceller, silemez |
| İzleyici | Yalnızca görüntüler |
| Onay Bekliyor | Kayıt olmuş, yönetici onayı bekliyor, veri göremez |
| Pasif | Erişimi kapatılmış |

**İlk kayıt olan kişi otomatik Yönetici olur**; sonraki kayıtlar yönetici onayı bekler.
Bu yüzden canlıya almadan önce ilk hesabı kendiniz açın.

## Kurulum (Supabase)

1. Supabase panelinde **SQL Editor**'ü açıp `supabase/migrations/20260115000000_isg_semasi.sql`
   dosyasının tamamını çalıştırın (tablolar, roller ve RLS kuralları kurulur).
2. **Authentication → Providers → Email** açık olmalı. Hızlı denemede "Confirm email" seçeneğini
   kapatabilirsiniz; açık kalırsa kullanıcılar önce e-postadaki bağlantıyı onaylar.
3. `.env.example` dosyasını `.env` olarak kopyalayın ve **Project Settings → API** sayfasındaki
   Project URL ile `anon` (publishable) anahtarını yazın:
   ```
   VITE_SUPABASE_URL=https://<proje-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-anahtar>
   ```
   `service_role` anahtarını **asla** buraya yazmayın.
4. Canlıya alırken (Vercel/Netlify/Cloudflare Pages) aynı iki değişkeni sitenin ortam
   değişkenlerine ekleyin; derleme komutu `npm run build`, çıktı klasörü `dist`.
   Supabase **Authentication → URL Configuration → Site URL** alanına sitenizin adresini girin.

## Geliştirme

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # üretim derlemesi (dist/)
npm run preview  # derlenmiş hali önizle
```

Teknolojiler: Vite · React · TypeScript · Recharts · Supabase (Postgres + Auth)
