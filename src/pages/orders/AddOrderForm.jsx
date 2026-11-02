import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addOrUpdateOrder, getAllOrders } from '../../redux/features/ordersSlice.js';
export default function AddOrderForm() {
  const dispatch = useDispatch();
  const articles = useSelector((state) => state.articles.list);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const attempt = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true);
    if (!attempt.current) attempt.current = { idArticle: selected, quantity: Number(quantity), operationId: crypto.randomUUID() };
    try {
      await dispatch(addOrUpdateOrder(attempt.current)).unwrap();
      attempt.current = null;
      setQuantity(''); setSelected(''); setSearch('');
      setMessage('Commande enregistrée.');
      dispatch(getAllOrders());
    } catch (error) { setMessage(`${typeof error === 'string' ? error : error.message} Vous pouvez réessayer cette même commande.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section><h2 className="text-xl font-bold">Nouvelle commande</h2>
    {!articles.length && <p>Créez d’abord un article dans le stock.</p>}
    <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
      <label>Rechercher un article<input className="input input-bordered w-full" value={search} disabled={busy || Boolean(attempt.current)} onChange={(event) => { setSearch(event.target.value); setSelected(''); }} /></label>
      <label>Article<select className="select select-bordered w-full" required value={selected} disabled={busy || Boolean(attempt.current)} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Sélectionner un article</option>{articles.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      <label>Quantité<input className="input input-bordered w-full" type="number" min="1" step="1" required value={quantity} disabled={busy || Boolean(attempt.current)} onChange={(event) => setQuantity(event.target.value)} /></label>
      <button className="btn bg-green-700 text-white" disabled={busy || !selected || !quantity}>{busy ? 'Enregistrement…' : 'Ajouter la commande'}</button>
    </form>{message && <p role="status" className="mt-4">{message}</p>}
  </section>;
}
