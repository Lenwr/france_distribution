import { collection, deleteDoc, doc, getDocs, query, runTransaction } from './dataStore.js';
import { firestore } from '../hooks/useSupabase.js';

const name = 'achats';
export async function listPurchases() {
  const result = await getDocs(query(collection(firestore, name)));
  return result.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
}
export async function savePurchase(purchase) {
  const id = crypto.randomUUID();
  await runTransaction(firestore, async (transaction) => transaction.set(doc(firestore, name, id), { ...purchase, id, created_at: new Date().toISOString() }));
  return { ...purchase, id };
}
export async function deletePurchase(id) { await deleteDoc(doc(firestore, name, id)); }
