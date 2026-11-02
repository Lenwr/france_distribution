import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchArticles } from '../../redux/services/articlesService.js';

export default function InventoryDraft({ purchaseId }) {
  const [articles, setArticles] = useState([]); const [lines, setLines] = useState([{ id: '', quantity: 1 }]); const [message, setMessage] = useState(''); const key = `purchase-inventory:${purchaseId}`;
  useEffect(() => { fetchArticles().then(setArticles).catch((error) => setMessage(error.message)); const saved = localStorage.getItem(key); if (saved) setLines(JSON.parse(saved)); }, [key]);
  const update = (index, field, value) => setLines((current) => current.map((line, i) => i === index ? { ...line, [field]: value } : line));
  function saveDraft() { localStorage.setItem(key, JSON.stringify(lines)); setMessage('Inventaire provisoire sauvegardé, sans modifier le stock.'); }
  return <section className="stats-panel inventory-draft"><div className="panel-heading"><h2>Inventaire du ticket</h2><span>Document informatif — aucun impact sur le stock</span></div><div className="purchase-list">{lines.map((line, index) => <div className="form-grid" key={index}><select className="select" value={line.id} onChange={(event) => update(index, 'id', event.target.value)}><option value="">Choisir un article</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.name}</option>)}</select><input className="input" type="number" min="1" step="1" value={line.quantity} onChange={(event) => update(index, 'quantity', event.target.value)} /><button type="button" className="btn btn-sm" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>Retirer</button></div>)}</div><div className="sale-actions"><button type="button" className="btn" onClick={() => setLines((current) => [...current, { id: '', quantity: 1 }])}>Ajouter une ligne</button><button type="button" className="btn btn-primary" onClick={saveDraft}>Sauvegarder l’inventaire</button></div>{message && <p className="sale-message" role="status">{message}</p>}</section>;
}
InventoryDraft.propTypes = { purchaseId: PropTypes.string.isRequired };
