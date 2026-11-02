import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNewArticle } from '../../redux/features/articlesSlice.js';
import { fetchProduct } from '../../redux/services/articlesService.js';
import { validPrice } from '../../services/inventoryService.js';
import { formatPurchaseEur, formatEurFromXof } from '../../services/currency.js';
const BarcodeScanner = lazy(() => import('react-qr-barcode-scanner'));

export default function AddArticleForm() {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [code, setCode] = useState('');
  const [supplier, setSupplier] = useState('');
  const [image, setImage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const searchVersion = useRef(0);
  useEffect(() => () => { searchVersion.current++; }, []);
  async function lookup(value) {
    const version = ++searchVersion.current;
    const barcode = value.trim();
    if (!/^\d{8,14}$/.test(barcode)) { setMessage('Saisissez un code-barres de 8 à 14 chiffres.'); return; }
    setCode(barcode);
    setScanning(false);
    setMessage('Recherche du produit…');
    setSupplier('');
    try {
      const product = await fetchProduct(barcode);
      if (version !== searchVersion.current) return;
      setName(product?.product_name ?? '');
      setImage(product?.image_url ?? product?.image_front_url ?? '');
      setSupplier(product?.brands ?? '');
      setMessage(product ? 'Produit trouvé. Vérifiez les informations avant de l’ajouter.' : 'Produit non trouvé. Saisissez ses informations manuellement.');
    } catch {
      if (version === searchVersion.current) setMessage('Recherche indisponible. Vous pouvez saisir le produit manuellement.');
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (!name.trim()) throw new Error('Le nom de l’article est obligatoire.');
      if (code && !/^\d{8,14}$/.test(code.trim())) throw new Error('Le code-barres doit contenir 8 à 14 chiffres.');
      await dispatch(addNewArticle({ name: name.trim(), price: validPrice(price, true), sell_price: validPrice(sellPrice),
        code_ref: code.trim(), suppliers: supplier.trim(), avatar_url: image.trim(), quantity: 0 })).unwrap();
      searchVersion.current++;
      setName(''); setPrice(''); setSellPrice(''); setCode(''); setSupplier(''); setImage(''); setScanning(false);
      setMessage('Article ajouté. Réceptionnez une commande pour alimenter le stock.');
    } catch (error) { setMessage(typeof error === 'string' ? error : error.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="p-4 text-black"><h2 className="text-xl font-bold mb-4">Ajouter un article</h2>
    <button className="btn mb-4" onClick={() => setScanning(!scanning)} disabled={busy}>{scanning ? 'Arrêter le scan' : 'Scanner avec la caméra'}</button>
    {scanning && <div className="barcode-scanner" aria-label="Lecteur de code-barres"><Suspense fallback={<p role="status">Chargement de la caméra…</p>}><BarcodeScanner width="100%" height={260} facingMode="environment" videoConstraints={{ facingMode: { ideal: 'environment' } }} stopStream={!scanning} delay={300} onError={(error) => { setScanning(false); const detail = error?.name === 'NotAllowedError' ? 'Autorisez l’accès à la caméra dans votre navigateur, puis réessayez.' : 'Caméra inaccessible. Vérifiez que le site est en HTTPS ou sur localhost.'; setMessage(detail); }} onUpdate={(_, result) => { if (result) lookup(typeof result.getText === 'function' ? result.getText() : result.text); }} /></Suspense><p className="barcode-hint">Placez le code-barres dans le cadre. Si la caméra ne fonctionne pas, saisissez le code manuellement ci-dessous.</p></div>}
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label>Code-barres (facultatif)<input className="input input-bordered w-full" inputMode="numeric" autoFocus value={code} onChange={(event) => { searchVersion.current++; setCode(event.target.value.replace(/\D/g, '')); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); lookup(event.currentTarget.value); } }} placeholder="Scannez puis appuyez sur Entrée" disabled={busy} /></label>
      <button type="button" className="btn" disabled={busy || !code} onClick={() => lookup(code)}>Rechercher les informations du produit</button>
      <label>Nom de l’article<input className="input input-bordered w-full" required value={name} onChange={(event) => { searchVersion.current++; setName(event.target.value); }} disabled={busy} /></label>
      <label>Marque ou fournisseur<input className="input input-bordered w-full" value={supplier} onChange={(event) => setSupplier(event.target.value)} disabled={busy} /></label>
      <label>Image de l’article (facultatif)<input className="input input-bordered w-full" type="url" value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://…" disabled={busy} /></label>
      <label>Prix d’achat (EUR)<input className="input input-bordered w-full" type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} disabled={busy} />{price && <small className="currency-equivalent">{formatPurchaseEur(price)}</small>}</label>
      <label>Prix de vente (FCFA)<input className="input input-bordered w-full" type="number" min="0.01" step="0.01" required value={sellPrice} onChange={(event) => setSellPrice(event.target.value)} disabled={busy} />{sellPrice && <small className="currency-equivalent">≈ {formatEurFromXof(sellPrice)}</small>}</label>
      <button className="btn bg-green-700 text-white" disabled={busy}>{busy ? 'Ajout…' : 'Ajouter l’article'}</button>
    </form>{message && <p role="status" className="mt-4">{message}</p>}
  </section>;
}
