// Tarihler "YYYY-MM-DD" metni olarak saklanır; saat dilimi kayması olmasın diye
// Date nesnesine çevrilmeden doğrudan parçalanır.

const iki = (n: number) => String(n).padStart(2, '0');

export function bugun(): string {
  const d = new Date();
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

export function tarihParcala(iso: string): { yil: number; ay: number } {
  const [yil, ay] = iso.split('-').map(Number);
  return { yil, ay: ay - 1 };
}

export function trTarih(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
