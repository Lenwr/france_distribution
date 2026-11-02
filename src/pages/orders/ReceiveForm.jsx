import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { firestore } from '../../hooks/useSupabase.js';
import { receiveOrder } from '../../services/inventoryService.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { getAllOrders } from '../../redux/features/ordersSlice.js';
import { getAllArticles } from '../../redux/features/articlesSlice.js';

export default function ReceiveForm({ order, onReceived }) {
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const attempt = useRef(null);
  const lock = useRef(false);
  const dispatch = useDispatch();
  const { user } = useAuth();
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true);
    if (!attempt.current) attempt.current = { id: crypto.randomUUID(), quantity: Number(quantity) };
    try {
      await receiveOrder(firestore, order.id, attempt.current.quantity, attempt.current.id, user.id);
      attempt.current = null;
      setQuantity('');
      dispatch(getAllOrders()); dispatch(getAllArticles());
      onReceived();
    } catch (error) { setMessage(`${error.message} Vous pouvez réessayer cette même réception.`); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section><h2 className="text-xl font-bold">Réceptionner {order.name}</h2><p>Reste à réceptionner : {order.quantity}</p>
    <form onSubmit={submit} className="flex flex-col gap-4 mt-4">
      <label>Quantité reçue<input className="input input-bordered w-full" type="number" min="1" max={order.quantity} step="1" required value={quantity} disabled={busy || Boolean(attempt.current)} onChange={(event) => setQuantity(event.target.value)} /></label>
      <button className="btn bg-green-700 text-white" disabled={busy || !quantity}>{busy ? 'Réception…' : 'Réceptionner'}</button>
    </form>{message && <p role="status">{message}</p>}
  </section>;
}

ReceiveForm.propTypes = { order: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, quantity: PropTypes.number.isRequired }).isRequired, onReceived: PropTypes.func.isRequired };
