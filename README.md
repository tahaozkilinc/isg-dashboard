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
- **Ayarlar** — Firma adı ve KPI parametreleri (çalışan sayısı, yıllık çalışılan gün,
  günlük çalışma saati), örnek veri yükleme / tüm veriyi silme.

## KPI Formülleri (Excel ile aynı)

- Adam/Gün = çalışan sayısı × yıllık çalışılan gün
- Adam/Saat = Adam/Gün × günlük çalışma saati
- Kaza Sıklık Hızı = kaza sayısı × 1.000.000 / Adam-Saat
- Kaza Ağırlık Hızı = kayıp iş günü × 1.000 / Adam-Gün

## Veri Saklama

Veriler tarayıcının yerel deposunda (**localStorage**) tutulur; sunucu gerekmez.
Veri katmanı `src/store.ts` içinde tek dosyada toplandığından ileride Supabase gibi
bir veritabanına geçiş yalnızca bu katmanın değiştirilmesiyle yapılabilir.

## Geliştirme

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # üretim derlemesi (dist/)
npm run preview  # derlenmiş hali önizle
```

Teknolojiler: Vite · React · TypeScript · Recharts
