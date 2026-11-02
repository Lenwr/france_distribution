import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useProducts } from '../../hooks/useProduct.js';
import { validPrice } from '../../services/inventoryService.js';
import { getAllArticles } from '../../redux/features/articlesSlice.js';
import { formatPurchaseEur, formatEurFromXof } from '../../services/currency.js';

export default function ProductDetails({ article }) {
  const [price, setPrice] = useState(article.sell_price ?? '');
  const [purchasePrice, setPurchasePrice] = useState(article.price ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { updateProductPrice, updatePurchasePrice } = useProducts();
  const dispatch = useDispatch();
  async function save(event, field) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (field === 'sell') await updateProductPrice(article.id, validPrice(price));
      else await updatePurchasePrice(article.id, validPrice(purchasePrice, true));
      dispatch(getAllArticles());
      setMessage('Prix enregistré.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <section className="p-4 text-black"><h2 className="text-xl font-bold">{article.name}</h2>
    <form onSubmit={(event) => save(event, 'sell')} className="my-4 flex flex-wrap gap-2">
      <label>Prix de vente à Lomé (FCFA)<input className="input input-bordered w-full" type="number" min="0.01" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} /><small className="currency-equivalent">≈ {formatEurFromXof(price)}</small></label>
      <button className="btn bg-green-700 text-white self-end" disabled={busy}>Enregistrer le prix de vente</button>
    </form>
    <form onSubmit={(event) => save(event, 'purchase')} className="my-4 flex flex-wrap gap-2">
      <label>Prix d’achat (EUR)<input className="input input-bordered w-full" type="number" min="0" step="0.01" required value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /><small className="currency-equivalent">{formatPurchaseEur(purchasePrice)}</small></label>
      <button className="btn bg-green-700 text-white self-end" disabled={busy}>Enregistrer le prix d’achat</button>
    </form>
    {message && <p role="status">{message}</p>}
  </section>;
}

ProductDetails.propTypes = { article: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), sell_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }).isRequired };
