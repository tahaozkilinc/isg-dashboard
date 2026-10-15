export type Rol = 'admin' | 'uzman' | 'izleyici' | 'pasif';

export const ROLLER: { rol: Rol; ad: string; aciklama: string }[] = [
  { rol: 'admin', ad: 'Yönetici', aciklama: 'Yalnızca tanımlama yapar: kullanıcıları ve firma bilgisini yönetir. Veri girmez.' },
  { rol: 'uzman', ad: 'İSG Uzmanı', aciklama: 'Aylık göstergeleri girer ve düzeltir.' },
  { rol: 'izleyici', ad: 'İzleyici', aciklama: 'Yalnızca dashboard\'u görüntüler.' },
  { rol: 'pasif', ad: 'Pasif', aciklama: 'Erişimi kapatılmış.' },
];

export interface Kullanici {
  eposta: string;
  adSoyad: string;
  rol: Rol;
}

export interface Ayarlar {
  firmaAdi: string;
}

export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export const AYLAR_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;
