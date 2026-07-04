import { useState } from 'react';
import type { FormEvent } from 'react';
import { useIsgVeri, eylemler, yeniId } from '../store';
import {
  KAZA_TURLERI, KAZA_CESITLERI, KOK_SEBEPLER, YARALANMA_BOLGELERI,
} from '../types';
import type { Kaza, KazaTuru, KazaCesidi, YaralanmaBolgesi } from '../types';

const BUGUN = () => new Date().toISOString().slice(0, 10);

const BOS_FORM = {
  tarih: BUGUN(),
  adSoyad: '',
  bolum: '',
  tur: KAZA_TURLERI[0] as KazaTuru,
  cesit: KAZA_CESITLERI[0] as KazaCesidi,
  kokSebep: KOK_SEBEPLER[0] as string,
  yaralanmaBolgesi: YARALANMA_BOLGELERI[0] as YaralanmaBolgesi,
  kayipGun: 0,
  aciklama: '',
};

export function KazaBildirimi() {
  const veri = useIsgVeri();
  const [form, setForm] = useState({ ...BOS_FORM });
  const [kaydedildi, setKaydedildi] = useState(false);

  const guncelle = <K extends keyof typeof BOS_FORM>(alan: K, deger: (typeof BOS_FORM)[K]) => {
    setForm((f) => ({ ...f, [alan]: deger }));
  };

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    const kaza: Kaza = { id: yeniId(), ...form, kayipGun: Number(form.kayipGun) || 0 };
    eylemler.kazaEkle(kaza);
    setForm({ ...BOS_FORM, tarih: form.tarih });
    setKaydedildi(true);
    setTimeout(() => setKaydedildi(false), 2500);
  };

  const kazalar = [...veri.kazalar].sort((a, b) => b.tarih.localeCompare(a.tarih));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="kart">
        <h3>İş Kazası / Olay Bildirimi</h3>
        <form onSubmit={gonder}>
          <div className="form-grid">
            <div className="alan">
              <label htmlFor="k-tarih">Kaza Tarihi *</label>
              <input id="k-tarih" type="date" required value={form.tarih}
                onChange={(e) => guncelle('tarih', e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="k-ad">Kazazede Adı Soyadı</label>
              <input id="k-ad" type="text" placeholder="Ad Soyad" value={form.adSoyad}
                onChange={(e) => guncelle('adSoyad', e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="k-bolum">Bölüm / Birim</label>
              <input id="k-bolum" type="text" placeholder="Örn. Üretim" value={form.bolum}
                onChange={(e) => guncelle('bolum', e.target.value)} />
            </div>
            <div className="alan">
              <label htmlFor="k-tur">Kaza Türü *</label>
              <select id="k-tur" value={form.tur} onChange={(e) => guncelle('tur', e.target.value as KazaTuru)}>
                {KAZA_TURLERI.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="alan">
              <label htmlFor="k-cesit">Kaza/Olay Çeşidi *</label>
              <select id="k-cesit" value={form.cesit} onChange={(e) => guncelle('cesit', e.target.value as KazaCesidi)}>
                {KAZA_CESITLERI.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="alan">
              <label htmlFor="k-kok">Kök Sebep *</label>
              <select id="k-kok" value={form.kokSebep} onChange={(e) => guncelle('kokSebep', e.target.value)}>
                {KOK_SEBEPLER.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="alan">
              <label htmlFor="k-bolge">Yaralanma Bölgesi *</label>
              <select id="k-bolge" value={form.yaralanmaBolgesi}
                onChange={(e) => guncelle('yaralanmaBolgesi', e.target.value as YaralanmaBolgesi)}>
                {YARALANMA_BOLGELERI.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="alan">
              <label htmlFor="k-gun">Kayıp İş Günü</label>
              <input id="k-gun" type="number" min={0} value={form.kayipGun}
                onChange={(e) => guncelle('kayipGun', Number(e.target.value))} />
            </div>
            <div className="alan genis">
              <label htmlFor="k-aciklama">Kaza Açıklaması</label>
              <textarea id="k-aciklama" rows={2} placeholder="Kazanın oluş şekli, alınan aksiyonlar…"
                value={form.aciklama} onChange={(e) => guncelle('aciklama', e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="submit" className="btn">Bildirimi Kaydet</button>
            {kaydedildi && <span style={{ color: 'var(--good)', fontWeight: 600 }}>✓ Kaydedildi — dashboard güncellendi</span>}
          </div>
        </form>
      </div>

      <div className="kart">
        <h3>Kayıtlı Bildirimler ({kazalar.length})</h3>
        {kazalar.length === 0 ? (
          <div className="bos-durum">Henüz kaza bildirimi girilmedi.</div>
        ) : (
          <div className="tablo-sar">
            <table className="veri">
              <thead>
                <tr>
                  <th>Tarih</th><th>Ad Soyad</th><th>Bölüm</th><th>Tür</th>
                  <th>Çeşit</th><th>Kök Sebep</th><th>Bölge</th><th>Kayıp Gün</th><th></th>
                </tr>
              </thead>
              <tbody>
                {kazalar.map((k) => (
                  <tr key={k.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(k.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>{k.adSoyad || '—'}</td>
                    <td>{k.bolum || '—'}</td>
                    <td>{k.tur}</td>
                    <td>{k.cesit}</td>
                    <td>{k.kokSebep}</td>
                    <td>{k.yaralanmaBolgesi}</td>
                    <td className="sayi">{k.kayipGun}</td>
                    <td>
                      <button
                        className="btn tehlike mini"
                        onClick={() => { if (confirm('Bu kaza kaydı silinsin mi?')) eylemler.kazaSil(k.id); }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
