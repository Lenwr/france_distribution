import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, PackageOpen } from 'lucide-react';
import { supabase } from '../../hooks/useSupabase';
import { formatDualCurrency } from '../../services/currency.js';

export default function Catalogue() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publicIds, setPublicIds] = useState(new Set());
  const [publishing, setPublishing] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([supabase.from('articles').select('*'), supabase.from('catalogue_public').select('*')]).then(([articlesResult, publicResult]) => {
      if (!active) return;
      if (articlesResult.error) setError(articlesResult.error.message);
      else { setArticles(articlesResult.data || []); setPublicIds(new Set((publicResult.data || []).map((item) => item.id))); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function togglePublic(event, article) {
    event.preventDefault();
    event.stopPropagation();
    setPublishing(article.id);
    try {
      if (publicIds.has(article.id)) {
        const { error: deleteError } = await supabase.from('catalogue_public').delete().eq('id', article.id);
        if (deleteError) throw deleteError;
        setPublicIds((ids) => { const next = new Set(ids); next.delete(article.id); return next; });
      } else {
        const { error: publishError } = await supabase.from('catalogue_public').upsert({ id: article.id, name: article.name, image: article.image || '', category: article.category || article.suppliers || '', sell_price: article.sell_price, available: Number(article.quantity || 0) > 0, code_ref: article.code_ref || '', updated_at: new Date().toISOString() });
        if (publishError) throw publishError;
        setPublicIds((ids) => new Set(ids).add(article.id));
      }
    } catch (publishError) { setError(publishError.message || 'Publication impossible.'); }
    finally { setPublishing(''); }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => !term || [article.name, article.suppliers, article.code_ref].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [articles, search]);

  return <main>
    <div className="page-heading"><div><p className="eyebrow">CATALOGUE PRODUITS</p><h1>Nos produits</h1><p className="page-description">Retrouvez rapidement les articles disponibles à la vente.</p></div><Link className="btn btn-primary" to="/sales"><ShoppingBag size={16} /> Ouvrir la caisse</Link></div>
    {error && <div role="alert" className="alert alert-error mb-5">{error}</div>}
    <section className="catalogue-panel">
      <div className="catalogue-toolbar"><label className="search-field"><Search size={18} /><span className="sr-only">Rechercher dans le catalogue</span><input className="input" placeholder="Nom, marque ou code-barres…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="result-count">{filtered.length} produit{filtered.length > 1 ? 's' : ''}</span></div>
      {loading ? <p role="status" className="p-8">Chargement du catalogue…</p> : filtered.length ? <div className="catalogue-grid">{filtered.map((article) => { const quantity = Number(article.quantity || 0); const isPublic = publicIds.has(article.id); return <Link className="catalogue-card" to={`/catalogue/${article.id || article.idArticle}`} key={article.id || article.idArticle}><div className="catalogue-card-icon"><PackageOpen size={28} /></div><div className="catalogue-card-content"><p className="catalogue-category">{article.suppliers || 'Produit'}</p><h2>{article.name}</h2><p className="catalogue-code">{article.code_ref || 'Code-barres non renseigné'}</p><div className="catalogue-card-bottom"><strong>{article.sell_price > 0 ? formatDualCurrency(article.sell_price) : 'Prix à définir'}</strong><span className={quantity > 0 ? 'catalogue-available' : 'catalogue-unavailable'}>{quantity > 0 ? `${quantity} disponible(s)` : 'Rupture de stock'}</span></div><button type="button" className={`catalogue-toggle ${isPublic ? 'is-on' : ''}`} aria-label={isPublic ? `Retirer ${article.name} du catalogue public` : `Publier ${article.name} dans le catalogue public`} aria-pressed={isPublic} disabled={publishing === article.id} onClick={(event) => togglePublic(event, article)}><span /> <small>{publishing === article.id ? '…' : isPublic ? 'Public' : 'Privé'}</small></button></div></Link>; })}</div> : <div className="empty-state"><span className="empty-icon"><PackageOpen size={30} /></span><h3>Aucun produit trouvé</h3><p>Modifiez votre recherche ou ajoutez un article depuis la gestion du stock.</p><Link className="btn btn-primary" to="/">Gérer le stock</Link></div>}
    </section>
  </main>;
}
