import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getHistory } from '../../redux/features/historySlice.js';
export default function OrderHistory() {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.history);
  useEffect(() => { dispatch(getHistory()); }, [dispatch]);
  const date = (value) => Number.isNaN(new Date(value).getTime()) ? 'Date inconnue' : new Date(value).toLocaleString('fr-FR');
  return <section className="overflow-x-auto bg-white p-4">
    {loading && <p role="status">Chargement de l’historique…</p>}{error && <p role="alert">{error}</p>}
    <table className="table w-full"><thead><tr><th>Article</th><th>Opération</th><th>Quantité</th><th>Date</th></tr></thead><tbody>
      {[...list].sort((a, b) => String(b.date_commande).localeCompare(String(a.date_commande))).map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.type === 'reception' ? 'Réception' : 'Commande'}</td><td>{row.quantity}</td><td>{date(row.date_commande)}</td></tr>)}
      {!loading && !error && !list.length && <tr><td colSpan="4">Aucune opération enregistrée.</td></tr>}
    </tbody></table>
  </section>;
}
