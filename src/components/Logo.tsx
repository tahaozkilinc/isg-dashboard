import logo from '../assets/sunar-logo.png';

export function Logo({ yukseklik = 32 }: { yukseklik?: number }) {
  return <img className="sunar-logo" src={logo} alt="Sunar" height={yukseklik} style={{ height: yukseklik }} />;
}

/** Logodaki mısır tanelerinden esinlenen dekoratif desen */
export function MisirDeseni({ sinif = '' }: { sinif?: string }) {
  const satirlar = 7;
  const kolonlar = 6;
  const hucreler = [];
  for (let y = 0; y < satirlar; y++) {
    for (let x = 0; x < kolonlar; x++) {
      if ((x + y * 2) % 11 === 0) continue; // desen tam bir ızgara gibi durmasın
      hucreler.push(<rect key={`${x}-${y}`} x={x * 44} y={y * 36} width={38} height={30} rx={9} />);
    }
  }
  return (
    <svg className={`misir-deseni ${sinif}`} viewBox={`0 0 ${kolonlar * 44} ${satirlar * 36}`} aria-hidden="true" focusable="false">
      {hucreler}
    </svg>
  );
}
