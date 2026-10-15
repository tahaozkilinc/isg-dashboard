import { useState } from 'react';
import type { FormEvent } from 'react';
import { useDurum, eylemler, hataMetni } from '../store';

export function Ayarlar() {
  const { veri } = useDurum();
  const [form, setForm] = useState({ ...veri.ayarlar });
  const [kaydedildi, setKaydedildi] = useState(false);
  const [hata, setHata] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata('');
    setBekliyor(true);
    try {
      await eylemler.ayarlarGuncelle({
        firmaAdi: form.firmaAdi.trim() || 'FİRMA ADI',
        calisanSayisi: Math.max(0, Math.round(Number(form.calisanSayisi) || 0)),
        yillikCalisanGun: Math.min(366, Math.max(0, Math.round(Number(form.yillikCalisanGun) || 0))),
        gunlukSaat: Math.min(24, Math.max(0.5, Number(form.gunlukSaat) || 7.5)),
      });
      setKaydedildi(true);
      setTimeout(() => setKaydedildi(false), 2500);
    } catch (err) {
      setHata(hataMetni(err));
    } finally {
      setBekliyor(false);
    }
  };

  const adamGun = (Number(form.calisanSayisi) || 0) * (Number(form.yillikCalisanGun) || 0);
  const adamSaat = adamGun * (Number(form.gunlukSaat) || 0);

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="kart">
        <h3>Firma ve KPI Parametreleri</h3>
        <form onSubmit={gonder}>
          <div className="form-grid">
            <div className="alan genis">
              <label htmlFor="a-firma">Firma Adı</label>
              <input id="a-firma" type="text" maxLength={120} value={form.firmaAdi}
                onChange={(e) => setForm({ ...form, firmaAdi: e.target.value })} />
            </div>
            <div className="alan">
              <label htmlFor="a-calisan">Çalışan Sayısı</label>
              <input id="a-calisan" type="number" min={0} value={form.calisanSayisi}
                onChange={(e) => setForm({ ...form, calisanSayisi: Number(e.target.value) })} />
            </div>
            <div className="alan">
              <label htmlFor="a-gun">Yıllık Çalışılan Gün</label>
              <input id="a-gun" type="number" min={0} max={366} value={form.yillikCalisanGun}
                onChange={(e) => setForm({ ...form, yillikCalisanGun: Number(e.target.value) })} />
            </div>
            <div className="alan">
              <label htmlFor="a-saat">Günlük Çalışma Saati</label>
              <input id="a-saat" type="number" min={0.5} max={24} step={0.5} value={form.gunlukSaat}
                onChange={(e) => setForm({ ...form, gunlukSaat: Number(e.target.value) })} />
            </div>
          </div>
          <p className="bilgi-notu">
            Adam/Gün = {adamGun.toLocaleString('tr-TR')} · Adam/Saat = {adamSaat.toLocaleString('tr-TR')} —
            Kaza sıklık ve ağırlık hızı bu değerlerle hesaplanır.
          </p>
          {hata && <div className="uyari hata" role="alert">{hata}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn" disabled={bekliyor}>{bekliyor ? 'Kaydediliyor…' : 'Ayarları Kaydet'}</button>
            {kaydedildi && <span style={{ color: 'var(--good)', fontWeight: 600 }}>✓ Kaydedildi</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
