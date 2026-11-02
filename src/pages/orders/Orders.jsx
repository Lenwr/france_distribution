import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllOrders } from '../../redux/features/ordersSlice.js';
import ReceiveForm from './ReceiveForm.jsx';

export default function Orders() {
  const dispatch = useDispatch();
  const { list: orders, loading, error } = useSelector((state) => state.orders);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dispatch(getAllOrders()); }, [dispatch]);
  return <section className="p-4 bg-white w-full">
    {loading && <p role="status">Chargement des commandes…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div className="overflow-x-auto"><table className="table w-full"><thead><tr><th>Commande</th><th>Quantité restante</th><th>Actions</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}><td>{order.name}</td><td>{order.quantity}</td><td><button className="btn bg-green-700 text-white" onClick={() => { setSelected(order); dialog.current.showModal(); }}>Réceptionner</button></td></tr>)}
      {!loading && !error && !orders.length && <tr><td colSpan="3">Aucune commande en cours. Créez une commande pour alimenter votre stock.</td></tr>}
    </tbody></table></div>
    <dialog ref={dialog} className="modal" onClose={() => setSelected(null)}><div className="modal-box bg-white text-black">
      {selected && <ReceiveForm key={selected.id} order={selected} onReceived={() => { setMessage('Commande réceptionnée avec succès.'); dialog.current.close(); }} />}
      <form method="dialog" className="modal-action"><button className="btn">Fermer</button></form>
    </div></dialog>
  </section>;
}
