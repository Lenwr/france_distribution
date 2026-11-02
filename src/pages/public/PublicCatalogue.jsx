import { useEffect, useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { supabase } from '../../hooks/useSupabase';
import { formatDualCurrency } from '../../services/currency.js';

export default function PublicCatalogue() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('catalogue_public').select('*').then(({ data, error: fetchError }) => { if (fetchError) setError('Catalogue momentanément indisponible.'); else setProducts(data || []); }); }, []);
  return <main className="public-catalogue"><header className="public-catalogue-header"><div className="brand"><span className="brand-mark">fd<span>.</span></span><span>France<br /><strong>Distribution</strong></span></div><div><p className="eyebrow">CATALOGUE CLIENT</p><h1>Produits disponibles à Lomé</h1><p className="page-description">Prix de vente affichés en FCFA et en euros.</p></div></header>{error && <p role="alert" className="alert alert-error">{error}</p>}{!error && !products.length ? <div className="empty-state"><span className="empty-icon"><PackageOpen size={30} /></span><h2>Catalogue en préparation</h2><p>Les produits disponibles seront bientôt affichés.</p></div> : <div className="catalogue-grid">{products.map((product) => <article className="catalogue-card" key={product.id || product.code_ref}><div className="catalogue-card-icon"><PackageOpen size={28} /></div><div className="catalogue-card-content"><p className="catalogue-category">{product.category || 'Produit'}</p><h2>{product.name}</h2><p className="catalogue-code">{product.code_ref || 'Code-barres non renseigné'}</p><div className="catalogue-card-bottom"><strong>{formatDualCurrency(product.sell_price)}</strong><span className="catalogue-available">Disponible à Lomé</span></div></div></article>)}</div>}</main>;
}
