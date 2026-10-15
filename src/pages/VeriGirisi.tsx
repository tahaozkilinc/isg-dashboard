import { useMemo, useState } from 'react';
import { useDurum, eylemler, hataMetni } from '../store';
import type { Degisiklik } from '../store';
import { AYLAR_KISA } from '../types';
import { GOSTERGELER, GRUPLAR, anahtar, deger, sayiYaz, sonVeriAyi, yillar } from '../gostergeler';

/** Girilen metni sayıya çevirir: boş → null, geçersiz → undefined */
function cozumle(metin: string): number | null | undefined {
  const t = metin.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

const metne = (v: number | null) => (v === null ? '' : String(v).replace('.', ','));

export function VeriGirisi() {
  const { veri } = useDurum();
  const buYil = new Date().getFullYear();

  const varsayilan = useMemo(() => yillar(veri).find((y) => sonVeriAyi(veri, y) > 0) ?? buYil, [veri, buYil]);
  const [yil, setYil] = useState(varsayilan);
  const [taslak, setTaslak] = useState<Record<string, string>>({});
  const [hata, setHata] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [bekliyor, setBekliyor] = useState(false);

  const yilSecenekleri = useMemo(() => {
    const s = new Set<number>([...yillar(veri), buYil, buYil + 1]);
    return [...s].sort((a, b) => b - a);
  }, [veri, buYil]);

  const goster = (y: number, ay: number, kod: string): string => {
    const k = anahtar(y, ay, kod);
    return k in taslak ? taslak[k] : metne(deger(veri, y, ay, kod));
  };
  const etkin = (y: number, ay: number, kod: string): number | null => {
    const k = anahtar(y, ay, kod);
    if (k in taslak) { const c = cozumle(taslak[k]); return c === undefined ? null : c; }
    return deger(veri, y, ay, kod);
  };

  const degistir = (y: number, ay: number, kod: string, metin: string) => {
    const k = anahtar(y, ay, kod);
    const kayitli = metne(deger(veri, y, ay, kod));
    setMesaj('');
    setTaslak((t) => {
      const yeni = { ...t };
      if (metin.trim() === kayitli) delete yeni[k]; else yeni[k] = metin;
      return yeni;
    });
  };

  const gecersizler = Object.entries(taslak).filter(([, m]) => cozumle(m) === undefined).map(([k]) => k);
  const degisenSayisi = Object.keys(taslak).length;

  // Tutarlılık uyarıları (kaydı engellemez)
  const uyarilar: string[] = [];
  for (let a = 1; a <= 12; a++) {
    const v = (kod: string) => etkin(yil, a, kod);
    const toplam = v('kaza_toplam');
    const ad = AYLAR_KISA[a - 1];
    const topla = (...k: string[]) => (k.every((x) => v(x) === null) ? null : k.reduce((t, x) => t + (v(x) ?? 0), 0));
    if (toplam !== null) {
      const cins = topla('kaza_erkek', 'kaza_kadin');
      const yaka = topla('kaza_mavi', 'kaza_beyaz');
      const kayip = topla('kaza_gun_kayipli', 'kaza_gun_kayipsiz');
      if (cins !== null && cins !== toplam) uyarilar.push(`${ad}: erkek + kadın (${cins}) iş kazası sayısına (${toplam}) eşit değil`);
      if (yaka !== null && yaka !== toplam) uyarilar.push(`${ad}: mavi + beyaz yaka (${yaka}) iş kazası sayısına (${toplam}) eşit değil`);
      if (kayip !== null && kayip !== toplam) uyarilar.push(`${ad}: gün kayıplı + kayıpsız (${kayip}) iş kazası sayısına (${toplam}) eşit değil`);
    }
    const kg = v('kayip_gun');
    const kgYaka = topla('kayip_gun_mavi', 'kayip_gun_beyaz');
    if (kg !== null && kgYaka !== null && kg !== kgYaka) uyarilar.push(`${ad}: mavi + beyaz yaka kayıp gün (${kgYaka}) toplam kayıp güne (${kg}) eşit değil`);
  }

  const kaydet = async () => {
    setHata(''); setMesaj('');
    const liste: Degisiklik[] = Object.entries(taslak).map(([k, m]) => {
      const [y, a, kod] = k.split('|');
      return { yil: Number(y), ay: Number(a), kod, deger: cozumle(m) ?? null };
    });
    setBekliyor(true);
    try {
      await eylemler.veriKaydet(liste);
      setTaslak({});
      setMesaj(`✓ ${liste.length} değer kaydedildi. Dashboard güncellendi.`);
    } catch (e) {
      setHata(hataMetni(e));
    } finally {
      setBekliyor(false);
    }
  };

  const oncekiYillar = [yil - 1, yil - 2];

  return (
    <div className="veri-girisi">
      <div className="kart">
        <div className="veri-ust">
          <div>
            <h3 style={{ marginBottom: 4 }}>Aylık veri girişi</h3>
            <p className="bilgi-notu" style={{ margin: 0 }}>
              Excel'deki tablonun aynısı. Hücreye değeri yazın, bitince <strong>Kaydet</strong>'e basın. Boş bıraktığınız ay "veri girilmemiş" sayılır.
            </p>
          </div>
          <div className="veri-araclar">
            <label htmlFor="v-yil" className="alt">Yıl</label>
            <select id="v-yil" className="kucuk" value={yil} onChange={(e) => setYil(Number(e.target.value))}>
              {yilSecenekleri.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {uyarilar.length > 0 && (
          <div className="uyari bilgi" role="status" style={{ marginTop: 12 }}>
            <strong>Kontrol edin:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{uyarilar.map((u) => <li key={u}>{u}</li>)}</ul>
          </div>
        )}
        {hata && <div className="uyari hata" role="alert" style={{ marginTop: 12 }}>{hata}</div>}
        {mesaj && <div className="uyari iyi" role="status" style={{ marginTop: 12 }}>{mesaj}</div>}
      </div>

      <div className="kart" style={{ padding: 0 }}>
        <div className="tablo-sar dikey">
          <table className="veri giris-tablosu">
            <thead>
              <tr>
                <th className="ilk">{yil} — aylık değerler</th>
                {AYLAR_KISA.map((a) => <th key={a} className="sayi">{a}</th>)}
              </tr>
            </thead>
            <tbody>
              {GRUPLAR.map((grup) => (
                <GrupBloku key={grup} grup={grup} satir={(g) => (
                  Array.from({ length: 12 }, (_, i) => (
                    <Hucre
                      key={i} etiket={`${g.ad} ${AYLAR_KISA[i]} ${yil}`}
                      deger={goster(yil, i + 1, g.kod)}
                      degisti={anahtar(yil, i + 1, g.kod) in taslak}
                      gecersiz={gecersizler.includes(anahtar(yil, i + 1, g.kod))}
                      onChange={(m) => degistir(yil, i + 1, g.kod, m)}
                    />
                  ))
                )} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kart" style={{ padding: 0 }}>
        <div className="tablo-sar">
          <table className="veri giris-tablosu dar">
            <thead>
              <tr>
                <th className="ilk">Önceki yıllar — yıl toplamı <span className="bilgi-notu">(aylık dökümü yoksa)</span></th>
                {oncekiYillar.map((y) => <th key={y} className="sayi">{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {GRUPLAR.map((grup) => (
                <GrupBloku key={grup} grup={grup} kolon={3} satir={(g) => (
                  oncekiYillar.map((y) => (
                    <Hucre
                      key={y} etiket={`${g.ad} ${y} yıl toplamı`}
                      deger={goster(y, 0, g.kod)}
                      degisti={anahtar(y, 0, g.kod) in taslak}
                      gecersiz={gecersizler.includes(anahtar(y, 0, g.kod))}
                      onChange={(m) => degistir(y, 0, g.kod, m)}
                    />
                  ))
                )} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kaydet-cubugu" role="region" aria-label="Kaydet">
        <span>
          {degisenSayisi === 0 ? 'Değişiklik yok' : `${sayiYaz(degisenSayisi)} değişiklik kaydedilmeyi bekliyor`}
          {gecersizler.length > 0 && <strong style={{ color: 'var(--critical)' }}> · {gecersizler.length} hücrede geçersiz sayı var</strong>}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="btn ikincil" disabled={degisenSayisi === 0 || bekliyor} onClick={() => { setTaslak({}); setMesaj(''); }}>Geri al</button>
          <button className="btn" disabled={degisenSayisi === 0 || gecersizler.length > 0 || bekliyor} onClick={() => void kaydet()}>
            {bekliyor ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </span>
      </div>
    </div>
  );
}

function GrupBloku({ grup, satir, kolon = 13 }: { grup: string; satir: (g: (typeof GOSTERGELER)[number]) => React.ReactNode; kolon?: number }) {
  return (
    <>
      <tr className="grup-satiri"><td colSpan={kolon}>{grup}</td></tr>
      {GOSTERGELER.filter((g) => g.grup === grup).map((g) => (
        <tr key={g.kod}>
          <td className="ilk">
            {g.ad}{g.birim && g.birim !== 'puan' && g.birim !== '%' ? <span className="birim"> ({g.birim})</span> : null}
            {g.ipucu && <span className="birim"> · {g.ipucu}</span>}
          </td>
          {satir(g)}
        </tr>
      ))}
    </>
  );
}

function Hucre({ deger, degisti, gecersiz, onChange, etiket }: {
  deger: string; degisti: boolean; gecersiz: boolean; onChange: (m: string) => void; etiket: string;
}) {
  return (
    <td className="hucre">
      <input
        className={`${degisti ? 'degisti' : ''} ${gecersiz ? 'gecersiz' : ''}`}
        inputMode="decimal" value={deger} aria-label={etiket} aria-invalid={gecersiz}
        onChange={(e) => onChange(e.target.value)}
      />
    </td>
  );
}
