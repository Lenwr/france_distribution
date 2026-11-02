import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, ShoppingBag, ReceiptText, ArrowLeft } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { firestore, supabase } from '../../hooks/useSupabase.js';
import { calculateSaleLine, summarizeSale, discountLabel } from '../../services/salePricing.js';
import { finalizeSale, validPrice } from '../../services/inventoryService.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { getAllArticles } from '../../redux/features/articlesSlice.js';

export default function Sales() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const storageKey = `sale-draft:${user.id}`;
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      return saved && typeof saved.id === 'string' && Array.isArray(saved.items) ? saved : null;
    } catch { return null; }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const lock = useRef(false);
  const searching = useRef(false);
  const input = useRef(null);
  useEffect(() => {
    if (draft) sessionStorage.setItem(storageKey, JSON.stringify(draft));
    else sessionStorage.removeItem(storageKey);
  }, [draft, storageKey]);
  useEffect(() => { if (draft?.id) input.current?.focus(); }, [draft?.id]);

  async function searchArticle(event) {
    event.preventDefault();
    if (!draft || !searchTerm.trim() || lock.current || searching.current) return;
    searching.current = true;
    const code = searchTerm.trim();
    const { data, error } = await supabase.from('articles').select('*').eq('code_ref', code).single();
    searching.current = false;
    if (error || !data) { setMessage(error?.code === 'PGRST116' ? 'Article non trouvé.' : error?.message || 'Article non trouvé.'); return; }
    try { validPrice(data.sell_price); } catch { setMessage('Définissez un prix de vente valide pour cet article dans le stock.'); return; }
    const stock = Number(data.quantity ?? 0);
    if (!Number.isSafeInteger(stock) || stock < 1) { setMessage('Article en rupture de stock.'); return; }
    // Never insert a response into a different or already completed sale.
    setDraft((current) => {
      if (!current || current.id !== draft.id || lock.current) return current;
      const existing = current.items.find((item) => item.id === data.id);
      const quantity = (existing?.quantity ?? 0) + 1;
      if (quantity > stock) return current;
      const item = { id: data.id, name: data.name, sell_price: Number(data.sell_price), quantity, stockQuantity: stock, discount_type: existing?.discount_type ?? 'percent', discount_value: existing?.discount_value ?? 0 };
      return { ...current, items: existing ? current.items.map((row) => row.id === item.id ? item : row) : [...current.items, item] };
    });
    setMessage('');
    setSearchTerm('');
    input.current?.focus();
  }

  async function validate() {
    if (!draft?.items.length || lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const received = amountReceived === '' ? Number(totals.total) : Number(amountReceived);
      const changeDue = paymentMethod === 'cash' ? received - Number(totals.total || 0) : 0;
      if (paymentMethod === 'cash' && received < totals.total) throw new Error('Le montant reçu est insuffisant.');
      const result = await finalizeSale(firestore, draft.id, draft.items, user.id, { method: paymentMethod, amountReceived: received, changeDue });
      setReceipt(result);
      setDraft(null);
      sessionStorage.removeItem(storageKey);
      dispatch(getAllArticles());
      setMessage('Vente enregistrée. Vous pouvez télécharger le reçu.');
    } catch (error) { setMessage(error.message); }
    finally { lock.current = false; setBusy(false); }
  }

  async function downloadReceipt() {
    if (!receipt || exporting) return;
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const pdf = new jsPDF();
      pdf.text('France Distribution — Reçu de vente', 10, 12);
      pdf.setFontSize(10);
      pdf.text(`Référence : ${receipt.id}`, 10, 20);
      pdf.text(`Date : ${new Date(receipt.created_at).toLocaleString('fr-FR')}`, 10, 27);
      autoTable(pdf, { startY: 34, head: [['Article', 'Qté', 'Prix unitaire (FCFA)', 'Brut (FCFA)', 'Remise', 'Net (FCFA)']],
        body: receipt.items.map((item) => [item.name, item.quantity, item.prix_unitaire.toFixed(2), (item.gross_total ?? item.total).toFixed(2), discountLabel(item), item.total.toFixed(2)]) });
      let summaryY = pdf.lastAutoTable.finalY + 10;
      if (summaryY + 24 > pdf.internal.pageSize.getHeight() - 10) { pdf.addPage(); summaryY = 20; }
      pdf.text(`Total avant remise : ${(receipt.gross_total ?? receipt.total).toFixed(2)} FCFA`, 10, summaryY);
      pdf.text(`Remises : ${(receipt.discount_total ?? 0).toFixed(2)} FCFA`, 10, summaryY + 8);
      pdf.text(`Net à payer : ${receipt.total.toFixed(2)} FCFA`, 10, summaryY + 16);
      pdf.save(`recu-${receipt.id}.pdf`);
    } catch { setMessage('La vente est enregistrée, mais le reçu n’a pas pu être généré. Réessayez le téléchargement.'); }
    finally { setExporting(false); }
  }

  const pricedItems = (draft?.items ?? []).map((item) => {
    try { return { item, pricing: calculateSaleLine(item) }; }
    catch (error) { return { item, error: error.message }; }
  });
  let totals;
  let pricingError = pricedItems.some((row) => row.error) ? 'Corrigez les remises signalées pour finaliser la vente.' : '';
  if (!pricingError) {
    try { totals = summarizeSale(pricedItems.map((row) => row.pricing)); }
    catch (error) { pricingError = error.message; }
  }
  function updateDiscount(id, fields) {
    setDraft((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...fields } : item) }));
  }
  return <main className="sales-page">
    <div className="page-heading"><div><p className="eyebrow">VENDRE, EN TOUTE SIMPLICITÉ</p><h1>Caisse</h1><p className="page-description">Composez votre vente et ajustez vos remises par produit.</p></div><Link className="btn" to="/"><ArrowLeft size={16} />Retour au stock</Link></div>
    <div className="sale-actions"><span className={`sale-status ${draft ? 'sale-open' : ''}`}><span />{draft ? 'Vente en cours' : 'Prêt pour une nouvelle vente'}</span><button className="btn btn-primary" disabled={Boolean(draft) || busy} onClick={() => { setDraft({ id: crypto.randomUUID(), items: [] }); setReceipt(null); setMessage(''); }}>Démarrer une vente</button>
    {draft && <button className="btn ml-2" disabled={busy} onClick={() => { if (window.confirm('Abandonner cette vente en cours ?')) setDraft(null); }}>Abandonner</button>}
    </div><div className="checkout-layout"><section className="checkout-items"><div className="panel-heading"><h2><ShoppingBag size={19} /> Articles de la vente</h2><span>{draft?.items.length ?? 0} référence{(draft?.items.length ?? 0) > 1 ? 's' : ''}</span></div>
    <form onSubmit={searchArticle} className="scan-form">
      <label className="search-field"><ScanLine size={20} /><span className="sr-only">Code-barres</span><input placeholder="Scanner ou saisir un code-barres…" ref={input} className="input" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={!draft || busy} /></label>
      <button type="submit" className="btn" disabled={!draft || busy}>Ajouter</button>
    </form>
    <div className="overflow-x-auto mt-4"><table className="table w-full"><thead><tr><th>Article</th><th>Prix (FCFA)</th><th>Quantité</th><th>Total brut (FCFA)</th><th>Remise sur la ligne</th><th>Total net (FCFA)</th><th>Actions</th></tr></thead><tbody>
      {pricedItems.map(({ item, pricing, error }) => <tr key={item.id}>
        <td>{item.name}</td><td>{item.sell_price.toFixed(2)}</td><td><input aria-label={`Quantité de ${item.name}`} type="number" min="1" max={item.stockQuantity} step="1" value={item.quantity} disabled={busy} className="input w-24" onChange={(event) => {
          const quantity = Number(event.target.value);
          if (Number.isSafeInteger(quantity) && quantity > 0 && quantity <= item.stockQuantity) setDraft((current) => ({ ...current, items: current.items.map((row) => row.id === item.id ? { ...row, quantity } : row) }));
        }} /></td><td>{(Math.round(item.sell_price * 100) * item.quantity / 100).toFixed(2)}</td>
        <td>
          <div className="flex flex-wrap gap-2">
            <select aria-label={`Type de remise pour ${item.name}`} className="select select-bordered w-24" value={item.discount_type ?? 'percent'} disabled={busy} onChange={(event) => updateDiscount(item.id, { discount_type: event.target.value, discount_value: 0 })}>
              <option value="percent">%</option><option value="amount">FCFA</option>
            </select>
            <input aria-label={`Remise pour ${item.name}`} aria-invalid={Boolean(error)} aria-describedby={error ? `discount-error-${item.id}` : undefined} className="input input-bordered w-28" type="number" min="0" step="0.01" max={(item.discount_type ?? 'percent') === 'percent' ? 100 : Math.round(item.sell_price * 100) * item.quantity / 100} value={item.discount_value ?? 0} disabled={busy} onChange={(event) => updateDiscount(item.id, { discount_value: event.target.value })} />
          </div>
          {error ? <p id={`discount-error-${item.id}`} role="alert" className="text-red-700 mt-1">{error}</p> : <p className="text-sm mt-1">− {pricing.discount_amount.toFixed(2)} FCFA</p>}
        </td>
        <td>{pricing ? pricing.total.toFixed(2) : 'À corriger'}</td>
        <td><button className="btn" disabled={busy} onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((row) => row.id !== item.id) }))} aria-label={`Retirer ${item.name}`}>Retirer</button></td>
      </tr>)}
      {!draft?.items.length && <tr><td colSpan="7"><div className="empty-state"><span className="empty-icon"><ScanLine size={32} /></span><h3>{draft ? 'À vous de scanner' : 'Votre prochaine vente commence ici'}</h3><p>{draft ? 'Ajoutez un premier produit avec son code-barres.' : 'Démarrez une vente pour ajouter des produits au panier.'}</p></div></td></tr>}
    </tbody></table></div></section>
    <aside className="checkout-summary"><div className="panel-heading"><h2><ReceiptText size={19} /> Récapitulatif</h2></div>
    <div className="sale-totals" aria-live="polite">
      {totals && <><p>Total avant remise : {totals.gross_total.toFixed(2)} FCFA</p><p>Remises : {totals.discount_total.toFixed(2)} FCFA</p><p className="net-total">Net à payer : {totals.total.toFixed(2)} FCFA</p><div className="payment-box"><label>Mode de paiement<select className="select w-full" value={paymentMethod} disabled={busy} onChange={(event) => { setPaymentMethod(event.target.value); setAmountReceived(''); }}><option value="cash">Espèces</option><option value="mobile_money">Mobile Money</option><option value="card">Carte bancaire</option></select></label>{paymentMethod === 'cash' && <><label>Montant reçu (FCFA)<input className="input w-full" type="number" min={totals.total} step="0.01" value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} placeholder={totals.total.toFixed(2)} /></label>{Number(amountReceived) >= totals.total && <p className="change-due">Monnaie à rendre : {(Number(amountReceived) - totals.total).toFixed(2)} FCFA</p>}</>}</div></>}
      {pricingError && <p role="alert" className="text-red-700">{pricingError}</p>}
    </div>
    <button className="btn btn-primary checkout-submit" disabled={!draft?.items.length || busy || Boolean(pricingError) || (paymentMethod === 'cash' && amountReceived !== '' && Number(amountReceived) < Number(totals?.total || 0))} onClick={validate}>{busy ? 'Enregistrement…' : 'Finaliser la vente'}</button>
    {receipt && <button className="btn receipt-download" disabled={exporting} onClick={downloadReceipt}>{exporting ? 'Préparation…' : 'Télécharger le reçu'}</button>}
    {message && <p role="status" className="sale-message">{message}</p>}<p className="checkout-note">Les remises s’appliquent séparément à chaque produit.</p></aside></div>
  </main>;
}
