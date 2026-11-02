import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Pencil, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../hooks/useSupabase';
import { formatDualCurrency, formatPurchaseEur } from '../../services/currency.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.from('articles').select('*').eq('id', id).single().then(({ data, error: fetchError }) => {
      if (!active) return;
      if (fetchError) setError(fetchError.message || 'Produit introuvable.');
      else setArticle(data);
    });
    return () => { active = false; };
  }, [id]);

  if (error) return <main><Link className="btn" to="/catalogue"><ArrowLeft size={16} /> Retour au catalogue</Link><div role="alert" className="alert alert-error mt-6">{error}</div></main>;
  if (!article) return <main><p role="status">Chargement du produit…</p></main>;
  const quantity = Number(article.quantity || 0);
  return <main>
    <Link className="btn mb-6" to="/catalogue"><ArrowLeft size={16} /> Retour au catalogue</Link>
    <section className="product-detail-card">
      <div className="product-detail-visual">{article.image || article.avatar_url ? <img src={article.image || article.avatar_url} alt={article.name} /> : <Boxes size={70} />}</div>
      <div className="product-detail-content"><p className="eyebrow">FICHE PRODUIT</p><h1>{article.name}</h1><p className="product-detail-code">Code-barres : {article.code_ref || 'Non renseigné'}</p><p className="product-detail-brand">{article.suppliers || 'Fournisseur non renseigné'}</p><div className="product-detail-price">{article.sell_price > 0 ? formatDualCurrency(article.sell_price) : 'Prix à définir'}</div><span className={quantity > 0 ? 'catalogue-available' : 'catalogue-unavailable'}>{quantity > 0 ? `${quantity} unité(s) disponible(s)` : 'Rupture de stock'}</span><div className="product-detail-actions"><Link className="btn btn-primary" to="/sales"><ShoppingBag size={16} /> Vendre ce produit</Link><Link className="btn" to="/"><Pencil size={16} /> Gérer le stock</Link></div></div>
    </section>
    <section className="product-detail-info"><h2>Informations</h2><dl><div><dt>Prix d’achat (privé)</dt><dd>{article.price > 0 ? formatPurchaseEur(article.price) : 'À définir'}</dd></div><div><dt>Prix de vente à Lomé</dt><dd>{article.sell_price > 0 ? formatDualCurrency(article.sell_price) : 'À définir'}</dd></div><div><dt>Stock disponible</dt><dd>{quantity} unité(s)</dd></div><div><dt>Fournisseur / marque</dt><dd>{article.suppliers || 'Non renseigné'}</dd></div></dl></section>
  </main>;
}
