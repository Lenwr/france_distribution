import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../hooks/useSupabase';
import ProductsList from './products/ProductsList.jsx';
import { formatDualCurrency, formatPurchaseEur } from '../services/currency.js';

const money = formatDualCurrency;

export default function Dashboard() {
  const [data, setData] = useState({ articles: [], orders: [], sales: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from('articles').select('*'),
      supabase.from('commandes').select('*'),
      supabase.from('ventes').select('*'),
    ]).then(([articles, orders, sales]) => {
      if (!active) return;
      const failed = [articles, orders, sales].find((entry) => entry.error);
      if (failed) throw failed.error;
      setData({ articles: articles.data || [], orders: orders.data || [], sales: sales.data || [] });
    }).catch((fetchError) => {
      if (active) setError(fetchError.message || 'Impossible de charger les indicateurs.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => ({
    lowStock: data.articles.filter((article) => Number(article.quantity || 0) <= 5),
    inventoryValue: data.articles.reduce((total, article) => total + Number(article.quantity || 0) * Number(article.price || 0), 0),
    salesTotal: data.sales.reduce((total, sale) => total + Number(sale.total || 0), 0),
  }), [data]);

  return <main className="space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">Vue d’ensemble</p><h1 className="text-3xl font-semibold">Pilotez votre distribution</h1><p className="mt-2 text-sm opacity-70">Stock, commandes et ventes au même endroit.</p></div>
      <div className="flex gap-2"><Link className="btn btn-outline btn-sm" to="/products">Voir les produits</Link><Link className="btn btn-primary btn-sm" to="/sales">Nouvelle vente</Link></div>
    </section>
    {error && <div role="alert" className="alert alert-error">{error}</div>}
    {loading ? <p role="status">Chargement des indicateurs…</p> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs principaux">
        <article className="stat rounded-box bg-base-200"><div className="stat-title">Articles</div><div className="stat-value">{data.articles.length}</div><div className="stat-desc">références en catalogue</div></article>
        <article className="stat rounded-box bg-base-200"><div className="stat-title">Stock faible</div><div className="stat-value text-warning">{metrics.lowStock.length}</div><div className="stat-desc">5 unités ou moins</div></article>
        <article className="stat rounded-box bg-base-200"><div className="stat-title">Valeur du stock</div><div className="stat-value text-lg">{formatPurchaseEur(metrics.inventoryValue)}</div><div className="stat-desc">au prix d’achat en EUR</div></article>
        <article className="stat rounded-box bg-base-200"><div className="stat-title">Ventes enregistrées</div><div className="stat-value text-lg">{money(metrics.salesTotal)}</div><div className="stat-desc">{data.sales.length} transaction(s)</div></article>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body"><div className="flex items-center justify-between"><h2 className="card-title">À réapprovisionner</h2><Link className="link link-primary text-sm" to="/products">Catalogue</Link></div>{metrics.lowStock.length === 0 ? <p className="text-sm opacity-70">Aucun article sous le seuil de sécurité.</p> : <ul className="divide-y divide-base-300">{metrics.lowStock.slice(0, 5).map((article) => <li className="flex justify-between gap-4 py-3" key={article.id || article.idArticle}><span>{article.name}</span><strong className="text-warning">{Number(article.quantity || 0)} unité(s)</strong></li>)}</ul>}</div></article>
        <article className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body"><div className="flex items-center justify-between"><h2 className="card-title">Commandes en cours</h2><Link className="link link-primary text-sm" to="/orders">Gérer</Link></div><p className="text-4xl font-semibold">{data.orders.length}</p><p className="text-sm opacity-70">commande(s) fournisseur à réceptionner.</p></div></article>
      </section>
    </>}
    <ProductsList />
  </main>;
}
