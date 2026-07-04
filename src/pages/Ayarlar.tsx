import { useState } from 'react';
import type { FormEvent } from 'react';
import { useIsgVeri, eylemler } from '../store';
import { ornekVeri } from '../seed';

export function Ayarlar() {
  const veri = useIsgVeri();
  const [form, setForm] = useState({ ...veri.ayarlar });
  const [kaydedildi, setKaydedildi] = useState(false);

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    eylemler.ayarlarGuncelle({
      firmaAdi: form.firmaAdi.trim() || 'FİRMA ADI',
      calisanSayisi: Number(form.calisanSayisi) || 0,
      yillikCalisanGun: Number(form.yillikCalisanGun) || 0,
      gunlukSaat: Number(form.gunlukSaat) || 7.5,
    });
    setKaydedildi(true);
    setTimeout(() => setKaydedildi(false), 2500);
  };

  const adamGun = (Number(form.calisanSayisi) || 0) * (Number(form.yillikCalisanGun) || 0);
  const adamSaat = adamGun * (Number(form.gunlukSaat) || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
      <div className="kart">
        <h3>Firma ve KPI Parametreleri</h3>
        <form onSubmit={gonder}>
          <div className="form-grid">
            <div className="alan genis">
              <label htmlFor="a-firma">Firma Adı</label>
              <input id="a-firma" type="text" value={form.firmaAdi}
                onChange={(e) => setForm({ ...form, firmaAdi: e.target.value })} />
            </div>
            <div className="alan">
              <label htmlFor="a-calisan">Çalışan Sayısı</label>
              <input id="a-calisan" type="number" min={0} value={form.calisanSayisi}
                onChange={(e) => setForm({ ...form, calisanSayisi: Number(e.target.value) })} />
            </div>
            <div className="alan">
              <label htmlFor="a-gun">Yıllık Çalışılan Gün</label>
              <input id="a-gun" type="number" min={0} value={form.yillikCalisanGun}
                onChange={(e) => setForm({ ...form, yillikCalisanGun: Number(e.target.value) })} />
            </div>
            <div className="alan">
              <label htmlFor="a-saat">Günlük Çalışma Saati</label>
              <input id="a-saat" type="number" min={0} step={0.5} value={form.gunlukSaat}
                onChange={(e) => setForm({ ...form, gunlukSaat: Number(e.target.value) })} />
            </div>
          </div>
          <p className="bilgi-notu">
            Adam/Gün = {adamGun.toLocaleString('tr-TR')} · Adam/Saat = {adamSaat.toLocaleString('tr-TR')} —
            Kaza sıklık ve ağırlık hızı bu değerlerle hesaplanır.
          </p>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn">Ayarları Kaydet</button>
            {kaydedildi && <span style={{ color: 'var(--good)', fontWeight: 600 }}>✓ Kaydedildi</span>}
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Veri Yönetimi</h3>
        <p style={{ color: 'var(--ink-2)', marginTop: 0 }}>
          Veriler bu tarayıcının yerel deposunda saklanır. Örnek verileri yükleyerek dashboard'u
          inceleyebilir veya tüm verileri silerek sıfırdan başlayabilirsiniz.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn ikincil"
            onClick={() => {
              if (veri.kazalar.length === 0 || confirm('Mevcut kayıtların yerine örnek veriler yüklensin mi?')) {
                eylemler.tumVeriyiYukle(ornekVeri());
              }
            }}
          >
            Örnek Verileri Yükle
          </button>
          <button
            className="btn tehlike"
            onClick={() => { if (confirm('TÜM veriler silinecek. Emin misiniz?')) eylemler.tumVeriyiSil(); }}
          >
            Tüm Verileri Sil
          </button>
        </div>
      </div>
    </div>
  );
}
