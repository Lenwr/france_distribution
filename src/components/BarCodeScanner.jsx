import { useState } from 'react';
import { ScanLine } from 'lucide-react';
export default function BarCodeScanner() {
  const [barcode, setBarcode] = useState('');
  return <main><div className="page-heading"><div><p className="eyebrow">LECTURE RAPIDE</p><h1>Scanner un produit</h1><p className="page-description">Utilisez votre lecteur de codes-barres ou saisissez un code.</p></div></div><section className="profile-card"><div className="empty-state"><span className="empty-icon"><ScanLine size={32} /></span><h2>Lire un code-barres</h2><p>Placez le curseur dans le champ, puis scannez votre produit.</p></div><label className="search-field"><ScanLine size={19} /><span className="sr-only">Code-barres</span><input className="input" autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scannez un code…" /></label>{barcode && <p role="status" className="mt-4">Code lu : <strong>{barcode}</strong></p>}</section></main>;
}
