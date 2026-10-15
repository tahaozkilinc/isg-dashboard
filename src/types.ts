// İSG veri modeli — Excel'deki "AYLIK İSG KPI RAPORU" yapısına birebir karşılık gelir.

export const KAZA_TURLERI = [
  'İlk Yardım',
  'Tıbbi Müdahaleli Kaza',
  'İş Günü Kayıplı Kaza',
  'Maddi Hasarlı Kaza',
  'Ölümlü Kaza',
  'Kısıtlı İş Görememezlik',
] as const;
export type KazaTuru = (typeof KAZA_TURLERI)[number];

export const KAZA_CESITLERI = [
  'KESİK',
  'YANIK/SICAK',
  'YANIK/KİMYASAL',
  'ELEKTRİK ÇARPMASI',
  'KIRIK/ÇIKIK/ÇATLAK',
  'BURKULMA/İNCİNME',
  'EZİLME',
  'SIKIŞARAK UZUV EZİLMESİ',
  'DELİNME/BATMA',
  'ABRAZYON/SIYRIK',
  'MORARMA',
  'YUMUŞAK DOKU ZEDELENMESİ',
  'UZUV KAYBI',
  'AMPÜTASYON',
  'İÇ ORGAN YARALANMASI',
  'TRAVMA',
  'BEYİN SARSINTISI',
  'SOLUNUM YETERSİZLİĞİ',
  'ALERJİ',
  'UV IŞIN',
  'RAHATSIZLANMA',
  'HASTALIK (KALP KRİZİ VB.)',
  'MAL/EKİPMAN KAZASI',
  'ARAÇ/TRAFİK KAZASI',
  'ARAÇ DEVRİLMESİ',
  'ARAÇ ÇARPIŞMASI',
  'ARACIN ÇARPMASI/ŞARAMPOLE GİRMESİ',
  'ARACA MALZEME DÜŞMESİ',
  'ARAÇTAN DÜŞME',
  'ARAÇ ALTINDA EZİLME/ÇARPMA',
  'YÜRÜRKEN DÜŞME',
  'TOPRAK KAYMASI',
  'YANGIN',
  'ÇEVRE KAZASI (DÖKÜNTÜ/SIZINTI VB.)',
  'DİĞER',
] as const;
export type KazaCesidi = (typeof KAZA_CESITLERI)[number];

export const YARALANMA_BOLGELERI = [
  'Baş - Boyun',
  'Omuz - Kollar',
  'Eller',
  'Karın - Göğüs',
  'Sırt - Bel',
  'Kalça - Kasık',
  'Bacak',
  'Ayak',
  'Yok / Uygulanmaz',
] as const;
export type YaralanmaBolgesi = (typeof YARALANMA_BOLGELERI)[number];

export const KOK_SEBEPLER = [
  'Talimatlara uyulmaması',
  'KKD kullanılmaması',
  'Eğitim eksikliği',
  'Dikkatsizlik / acelecilik',
  'Makine koruyucu eksikliği',
  'Bakım eksikliği',
  'Uygun olmayan ekipman kullanımı',
  'Düzensiz / dağınık çalışma alanı',
  'İşaretleme ve uyarı eksikliği',
  'Yorgunluk',
  'Denetim eksikliği',
  'Risk değerlendirmesi eksikliği',
  'Çevresel koşullar (zemin, hava vb.)',
  'Üçüncü şahıs kusuru',
  'Diğer',
] as const;

export interface Kaza {
  id: string;
  tarih: string; // ISO tarih (YYYY-MM-DD)
  adSoyad: string;
  bolum: string;
  tur: KazaTuru;
  cesit: KazaCesidi;
  kokSebep: string;
  yaralanmaBolgesi: YaralanmaBolgesi;
  kayipGun: number;
  aciklama: string;
}

export type UygunsuzlukDurum = 'AÇIK' | 'KAPALI';

export interface Uygunsuzluk {
  id: string;
  tarih: string;
  baslik: string;
  kokSebep: string;
  durum: UygunsuzlukDurum;
}

export interface Egitim {
  id: string;
  tarih: string;
  konu: string;
  katilimci: number; // eğitim alan personel sayısı
}

export interface Ayarlar {
  firmaAdi: string;
  calisanSayisi: number;
  yillikCalisanGun: number; // yıllık çalışılan gün sayısı
  gunlukSaat: number; // günlük çalışma saati (adam-saat hesabı için)
}

export interface IsgVeri {
  kazalar: Kaza[];
  uygunsuzluklar: Uygunsuzluk[];
  egitimler: Egitim[];
  ayarlar: Ayarlar;
}

export const VARSAYILAN_AYARLAR: Ayarlar = {
  firmaAdi: 'FİRMA ADI',
  calisanSayisi: 1400,
  yillikCalisanGun: 295,
  gunlukSaat: 7.5,
};

export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export type Rol = 'admin' | 'uzman' | 'izleyici' | 'beklemede' | 'pasif';

export const ROLLER: { rol: Rol; ad: string; aciklama: string }[] = [
  { rol: 'admin', ad: 'Yönetici', aciklama: 'Tüm kayıtları görür, ekler, siler; kullanıcıları ve ayarları yönetir' },
  { rol: 'uzman', ad: 'İSG Uzmanı', aciklama: 'Kayıt ekler ve düzenler, silemez' },
  { rol: 'izleyici', ad: 'İzleyici', aciklama: 'Yalnızca dashboard ve kayıtları görüntüler' },
  { rol: 'beklemede', ad: 'Onay Bekliyor', aciklama: 'Henüz erişimi yok' },
  { rol: 'pasif', ad: 'Pasif', aciklama: 'Erişimi kapatılmış' },
];

export interface Profil {
  id: string;
  eposta: string;
  adSoyad: string;
  rol: Rol;
}
