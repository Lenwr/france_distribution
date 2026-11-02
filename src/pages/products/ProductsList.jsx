import { Boxes, PackageCheck, TriangleAlert, PackageX, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllArticles } from '../../redux/features/articlesSlice.js';
import { useProducts } from '../../hooks/useProduct.js';
import Orders from '../orders/Orders.jsx';
import AddOrderForm from '../orders/AddOrderForm.jsx';
import ProductDetails from './productDetails.jsx';
import { formatPurchaseEur, formatDualCurrency } from '../../services/currency.js';
const AddArticleForm = lazy(() => import('./addProductForm.jsx'));
const OrderHistory = lazy(() => import('../orders/orderHistory.jsx'));

export default function ProductsList() {
  const dispatch = useDispatch();
  const { list: articles, loading, error } = useSelector((state) => state.articles);
  const { deleteProduct } = useProducts();
  const [tab, setTab] = useState('stock');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dispatch(getAllArticles()); }, [dispatch]);
  const filtered = articles.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()) || (search && item.code_ref?.includes(search))).sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pages);
  function open(type, article) { setMessage(''); setModal({ type, article }); dialog.current.showModal(); }
  async function remove() {
    if (busy) return;
    setBusy(true);
    try { await deleteProduct(modal.article.id); dispatch(getAllArticles()); dialog.current.close(); setMessage('Article supprimé.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const stats = [
    { label: 'Références au catalogue', value: articles.length, icon: Boxes, className: 'stat-neutral' },
    { label: 'Unités disponibles', value: articles.reduce((total, item) => total + Number(item.quantity || 0), 0), icon: PackageCheck, className: 'stat-green' },
    { label: 'Produits à réapprovisionner', value: articles.filter((item) => Number(item.quantity || 0) > 0 && Number(item.quantity) < 5).length, icon: TriangleAlert, className: 'stat-amber' },
    { label: 'Produits en rupture', value: articles.filter((item) => Number(item.quantity || 0) === 0).length, icon: PackageX, className: 'stat-red' },
  ];
  return <section className="inventory-page">
    <div className="page-heading"><div><p className="eyebrow">VOTRE ACTIVITÉ, EN UN COUP D’ŒIL</p><h1>Gestion du stock</h1><p className="page-description">Vos produits, vos approvisionnements. Toujours à jour.</p></div>
      <button className="btn btn-primary" onClick={() => open(tab === 'stock' ? 'add' : 'order')}><Plus size={17} />{tab === 'stock' ? 'Créer un article' : 'Nouvelle commande'}</button>
    </div>
    <div className="inventory-stats">{stats.map(({ label, value, icon: Icon, className }) => <article key={label} className={`metric-card ${className}`}><div className="metric-top"><span>{label}</span><Icon size={19} /></div><strong>{loading || error ? '—' : value.toLocaleString('fr-FR')}</strong><small>{label === 'Produits à réapprovisionner' ? 'Moins de 5 unités en stock' : label === 'Produits en rupture' ? 'Stock à zéro' : label === 'Unités disponibles' ? 'Tous produits confondus' : 'Votre catalogue actuel'}</small></article>)}</div>
    <div className="inventory-panel">
    <nav aria-label="Gestion des articles" className="inventory-tabs">
      {[['stock', 'Mon stock'], ['orders', 'Mes commandes'], ['history', 'Historique des commandes']].map(([value, label]) => <button key={value} className={`inventory-tab ${tab === value ? 'selected' : ''}`} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}
    </nav>
    {message && !modal && <p role="status">{message}</p>}
    {tab === 'stock' ? <>
      <div className="table-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">Rechercher par nom ou code-barres</span><input placeholder="Rechercher un produit, un code-barres…" className="input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><span className="result-count">{filtered.length} produit{filtered.length > 1 ? 's' : ''}</span></div>
      {loading && <p role="status">Chargement des articles…</p>}{error && <p role="alert">{error}</p>}
      <div className="overflow-x-auto bg-white rounded"><table className="table w-full"><thead><tr><th>Article</th><th>Quantité</th><th>Achat (FCFA)</th><th>Vente (FCFA)</th><th>Actions</th></tr></thead><tbody>
        {filtered.slice((currentPage - 1) * 25, currentPage * 25).map((article) => <tr key={article.id}><td><div className="product-identity"><span className="product-icon"><Boxes size={19} /></span><div><strong>{article.name}</strong><small>{article.code_ref || 'Sans code-barres'}</small></div></div></td><td><span className={`stock-pill ${Number(article.quantity ?? 0) === 0 ? 'stock-empty' : Number(article.quantity) < 5 ? 'stock-low' : 'stock-ok'}`}>{article.quantity ?? 0} <span>unités</span></span></td><td>{article.price > 0 ? formatPurchaseEur(article.price) : 'À définir'}</td><td>{article.sell_price > 0 ? formatDualCurrency(article.sell_price) : 'À définir'}</td><td><div className="flex gap-2"><button className="btn icon-button" aria-label={`Modifier ${article.name}`} onClick={() => open('edit', article)}><Pencil size={16} /></button><button className="btn icon-button danger-icon" aria-label={`Supprimer ${article.name}`} onClick={() => open('delete', article)}><Trash2 size={16} /></button></div></td></tr>)}
        {!loading && !error && !filtered.length && <tr><td colSpan="5"><div className="empty-state"><span className="empty-icon"><Boxes size={30} /></span><h3>{articles.length ? 'Aucun produit trouvé' : 'Votre catalogue commence ici'}</h3><p>{articles.length ? 'Aucun résultat. Essayez un autre nom ou code-barres.' : 'Votre stock est vide. Créez votre premier article, puis une commande pour le réceptionner.'}</p>{!articles.length && <button className="btn btn-primary" onClick={() => open('add')}><Plus size={16} />Ajouter mon premier produit</button>}</div></td></tr>}
      </tbody></table></div>
      {pages > 1 && <nav className="flex items-center gap-4 mt-4" aria-label="Pagination"><button className="btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Précédent</button><span>{currentPage} / {pages}</span><button className="btn" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Suivant</button></nav>}
    </> : tab === 'orders' ? <Orders /> : <Suspense fallback={<p>Chargement…</p>}><OrderHistory /></Suspense>}
    </div>
    <dialog ref={dialog} className="modal" onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => setModal(null)}><div className="modal-box bg-white text-black">
      <Suspense fallback={<p>Chargement…</p>}>
        {modal?.type === 'add' && <AddArticleForm />}
        {modal?.type === 'order' && <AddOrderForm />}
        {modal?.type === 'edit' && <ProductDetails key={modal.article.id} article={modal.article} />}
        {modal?.type === 'delete' && <><h2 className="text-xl">Supprimer {modal.article.name} ?</h2><p>Cette action est définitive.</p><button className="btn bg-red-700 text-white mt-4" disabled={busy} onClick={remove}>{busy ? 'Suppression…' : 'Confirmer la suppression'}</button>{message && <p role="alert">{message}</p>}</>}
      </Suspense><form method="dialog" className="modal-action"><button className="btn" disabled={busy}>Fermer</button></form>
    </div></dialog>
  </section>;
}
