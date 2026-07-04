import type { IsgVeri, Kaza } from './types';
import { VARSAYILAN_AYARLAR } from './types';
import { yeniId } from './store';

// Excel'deki örnek rapora benzer, uygulamayı boş açmamak için yüklenebilen örnek veri seti.
const YIL = new Date().getFullYear();

const ORNEK_KAZALAR: Omit<Kaza, 'id'>[] = [
  { tarih: `${YIL}-01-08`, adSoyad: 'Ahmet Yılmaz', bolum: 'Üretim', tur: 'İlk Yardım', cesit: 'KESİK', kokSebep: 'KKD kullanılmaması', yaralanmaBolgesi: 'Eller', kayipGun: 0, aciklama: 'Sac levha taşırken eldivensiz çalışma sonucu elde yüzeysel kesik.' },
  { tarih: `${YIL}-01-21`, adSoyad: 'Mehmet Demir', bolum: 'Bakım', tur: 'İş Günü Kayıplı Kaza', cesit: 'DELİNME/BATMA', kokSebep: 'Talimatlara uyulmaması', yaralanmaBolgesi: 'Ayak', kayipGun: 5, aciklama: 'Zeminde bırakılan çivili tahtaya basma sonucu ayak yaralanması.' },
  { tarih: `${YIL}-02-04`, adSoyad: 'Ayşe Kaya', bolum: 'Depo', tur: 'Tıbbi Müdahaleli Kaza', cesit: 'EZİLME', kokSebep: 'Düzensiz / dağınık çalışma alanı', yaralanmaBolgesi: 'Eller', kayipGun: 0, aciklama: 'Raf düzenlemesi sırasında düşen koli nedeniyle elde ezilme.' },
  { tarih: `${YIL}-02-17`, adSoyad: 'Ali Çelik', bolum: 'Üretim', tur: 'İş Günü Kayıplı Kaza', cesit: 'YANIK/SICAK', kokSebep: 'Makine koruyucu eksikliği', yaralanmaBolgesi: 'Omuz - Kollar', kayipGun: 8, aciklama: 'Pres hattında sıcak yüzeye temas sonucu kolda yanık.' },
  { tarih: `${YIL}-03-03`, adSoyad: 'Fatma Şahin', bolum: 'Kalite', tur: 'İlk Yardım', cesit: 'BURKULMA/İNCİNME', kokSebep: 'Çevresel koşullar (zemin, hava vb.)', yaralanmaBolgesi: 'Ayak', kayipGun: 0, aciklama: 'Islak zeminde kayma sonucu ayak bileğinde burkulma.' },
  { tarih: `${YIL}-03-25`, adSoyad: 'Hasan Koç', bolum: 'Lojistik', tur: 'Maddi Hasarlı Kaza', cesit: 'MAL/EKİPMAN KAZASI', kokSebep: 'Dikkatsizlik / acelecilik', yaralanmaBolgesi: 'Yok / Uygulanmaz', kayipGun: 0, aciklama: 'Forklift manevrası sırasında raf ayağına çarpma; yaralanma yok.' },
  { tarih: `${YIL}-04-10`, adSoyad: 'Emre Arslan', bolum: 'Bakım', tur: 'Tıbbi Müdahaleli Kaza', cesit: 'ELEKTRİK ÇARPMASI', kokSebep: 'Eğitim eksikliği', yaralanmaBolgesi: 'Eller', kayipGun: 0, aciklama: 'Pano bakımında enerji kesilmeden çalışma sonucu hafif elektrik çarpması.' },
  { tarih: `${YIL}-05-06`, adSoyad: 'Zeynep Aydın', bolum: 'Üretim', tur: 'İş Günü Kayıplı Kaza', cesit: 'KIRIK/ÇIKIK/ÇATLAK', kokSebep: 'İşaretleme ve uyarı eksikliği', yaralanmaBolgesi: 'Bacak', kayipGun: 6, aciklama: 'Seviye farkı işaretlenmemiş platformdan düşme sonucu bacakta çatlak.' },
  { tarih: `${YIL}-05-19`, adSoyad: 'Murat Öz', bolum: 'Saha', tur: 'İlk Yardım', cesit: 'YÜRÜRKEN DÜŞME', kokSebep: 'Çevresel koşullar (zemin, hava vb.)', yaralanmaBolgesi: 'Kalça - Kasık', kayipGun: 0, aciklama: 'Saha yürüyüşünde engebeli zeminde düşme, hafif morarma.' },
  { tarih: `${YIL}-06-02`, adSoyad: 'Selin Kurt', bolum: 'Ofis', tur: 'İlk Yardım', cesit: 'RAHATSIZLANMA', kokSebep: 'Diğer', yaralanmaBolgesi: 'Yok / Uygulanmaz', kayipGun: 0, aciklama: 'Çalışma sırasında ani tansiyon düşmesi, revirde müdahale edildi.' },
  { tarih: `${YIL}-06-23`, adSoyad: 'Okan Doğan', bolum: 'Üretim', tur: 'İş Günü Kayıplı Kaza', cesit: 'SIKIŞARAK UZUV EZİLMESİ', kokSebep: 'Makine koruyucu eksikliği', yaralanmaBolgesi: 'Eller', kayipGun: 2, aciklama: 'Konveyör bandı ile şase arasına parmak sıkışması.' },
  { tarih: `${YIL}-07-01`, adSoyad: 'Canan Erdem', bolum: 'Depo', tur: 'Tıbbi Müdahaleli Kaza', cesit: 'ARACA MALZEME DÜŞMESİ', kokSebep: 'Denetim eksikliği', yaralanmaBolgesi: 'Baş - Boyun', kayipGun: 0, aciklama: 'İstiflenen malzemenin devrilmesi sonucu başa hafif darbe; baret hasar aldı.' },
];

export function ornekVeri(): IsgVeri {
  return {
    kazalar: ORNEK_KAZALAR.map((k) => ({ ...k, id: yeniId() })),
    uygunsuzluklar: [
      { id: yeniId(), tarih: `${YIL}-01-15`, baslik: 'Acil çıkış kapısı önünde malzeme istifi', kokSebep: 'Düzensiz / dağınık çalışma alanı', durum: 'KAPALI' },
      { id: yeniId(), tarih: `${YIL}-02-09`, baslik: 'Yangın söndürücü periyodik kontrolü gecikmiş', kokSebep: 'Denetim eksikliği', durum: 'KAPALI' },
      { id: yeniId(), tarih: `${YIL}-03-12`, baslik: 'Forklift geçiş yolu çizgileri silinmiş', kokSebep: 'İşaretleme ve uyarı eksikliği', durum: 'AÇIK' },
      { id: yeniId(), tarih: `${YIL}-04-20`, baslik: 'Pres makinesinde çift el kumanda devre dışı', kokSebep: 'Makine koruyucu eksikliği', durum: 'AÇIK' },
      { id: yeniId(), tarih: `${YIL}-05-27`, baslik: 'Kimyasal depoda MSDS föyleri eksik', kokSebep: 'Talimatlara uyulmaması', durum: 'KAPALI' },
      { id: yeniId(), tarih: `${YIL}-06-16`, baslik: 'Yüksekte çalışmada emniyet kemeri takılmıyor', kokSebep: 'KKD kullanılmaması', durum: 'AÇIK' },
    ],
    egitimler: [
      { id: yeniId(), tarih: `${YIL}-01-10`, konu: 'Temel İSG Eğitimi', katilimci: 85 },
      { id: yeniId(), tarih: `${YIL}-02-14`, konu: 'Yangın ve Acil Durum', katilimci: 60 },
      { id: yeniId(), tarih: `${YIL}-03-20`, konu: 'KKD Kullanımı', katilimci: 45 },
      { id: yeniId(), tarih: `${YIL}-04-18`, konu: 'Yüksekte Çalışma', katilimci: 30 },
      { id: yeniId(), tarih: `${YIL}-05-22`, konu: 'El Aletleri ile Güvenli Çalışma', katilimci: 34 },
    ],
    ayarlar: { ...VARSAYILAN_AYARLAR },
  };
}
