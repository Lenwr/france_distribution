import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '../../hooks/useSupabase';
import { formatDualCurrency } from '../../services/currency.js';

const periods = { today: 'Aujourd’hui', week: '7 derniers jours', month: '30 derniers jours', all: 'Tout' };
function since(period) { const date = new Date(); if (period === 'today') date.setHours(0, 0, 0, 0); if (period === 'week') date.setDate(date.getDate() - 7); if (period === 'month') date.setDate(date.getDate() - 30); return period === 'all' ? null : date; }

export default function SalesStats() {
  const [sales, setSales] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('ventes').select('*').then(({ data, error: fetchError }) => { if (fetchError) setError(fetchError.message); else setSales(data || []); }).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => { const start = since(period); return sales.filter((sale) => !start || new Date(sale.created_at || 0) >= start); }, [sales, period]);
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const gross = filtered.reduce((sum, sale) => sum + Number(sale.gross_total || sale.total || 0), 0);
    const discount = filtered.reduce((sum, sale) => sum + Number(sale.discount_total || 0), 0);
    const products = {};
    filtered.forEach((sale) => (sale.items || []).forEach((item) => { const key = item.name || item.id_article; products[key] = (products[key] || 0) + Number(item.quantity || 0); }));
    return { total, gross, discount, count: filtered.length, average: filtered.length ? total / filtered.length : 0, products: Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 5) };
  }, [filtered]);
  return <main><div className="page-heading"><div><p className="eyebrow">PILOTAGE COMMERCIAL</p><h1>Statistiques des ventes</h1><p className="page-description">Suivez le chiffre d’affaires réalisé à Lomé.</p></div><div className="stats-periods" role="group" aria-label="Période">{Object.entries(periods).map(([value, label]) => <button className={`btn btn-sm ${period === value ? 'btn-primary' : ''}`} key={value} onClick={() => setPeriod(value)} aria-pressed={period === value}><CalendarDays size={14} />{label}</button>)}</div></div>
    {error && <p role="alert" className="alert alert-error">{error}</p>}{loading ? <p role="status">Chargement des statistiques…</p> : <>
      <section className="stats-kpis"><article className="metric-card stat-green"><span>Chiffre d’affaires</span><strong>{formatDualCurrency(stats.total)}</strong><small>net après remises</small></article><article className="metric-card"><span>Ventes</span><strong>{stats.count}</strong><small>transactions</small></article><article className="metric-card"><span>Panier moyen</span><strong>{formatDualCurrency(stats.average)}</strong><small>par vente</small></article><article className="metric-card stat-amber"><span>Remises</span><strong>{formatDualCurrency(stats.discount)}</strong><small>sur {formatDualCurrency(stats.gross)} brut</small></article></section>
      <section className="stats-columns"><article className="stats-panel"><div className="panel-heading"><h2><TrendingUp size={18} /> Résumé de la période</h2><span>{periods[period]}</span></div><div className="stats-summary"><p>Le chiffre d’affaires net est de <strong>{formatDualCurrency(stats.total)}</strong>.</p><p>{stats.count ? `Le panier moyen est de ${formatDualCurrency(stats.average)} par transaction.` : 'Aucune vente sur cette période.'}</p><p className="stats-note">Les prix d’achat restent privés et sont conservés en EUR pour calculer la marge dans une prochaine version.</p></div></article><article className="stats-panel"><div className="panel-heading"><h2><BarChart3 size={18} /> Produits les plus vendus</h2><span>unités</span></div>{stats.products.length ? <ol className="top-products">{stats.products.map(([name, quantity], index) => <li key={name}><span className="top-rank">{index + 1}</span><span>{name}</span><strong>{quantity}</strong></li>)}</ol> : <p className="stats-empty">Pas encore de produit vendu.</p>}</article></section>
      <section className="stats-panel stats-sales-table"><div className="panel-heading"><h2>Dernières ventes</h2><span>{filtered.length} résultat(s)</span></div><div className="overflow-x-auto"><table className="table w-full"><thead><tr><th>Date</th><th>Référence</th><th>Articles</th><th>Remise</th><th>Total net</th></tr></thead><tbody>{filtered.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20).map((sale) => <tr key={sale.id}><td>{sale.created_at ? new Date(sale.created_at).toLocaleDateString('fr-FR') : '—'}</td><td>{sale.id}</td><td>{(sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</td><td>{formatDualCurrency(sale.discount_total || 0)}</td><td><strong>{formatDualCurrency(sale.total)}</strong></td></tr>)}</tbody></table></div></section>
    </>}</main>;
}
