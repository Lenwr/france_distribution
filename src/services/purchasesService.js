import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, updateDoc } from './dataStore.js';
import { firestore } from '../hooks/useSupabase.js';
import { firebaseStorage } from './firebaseClient.js';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const name = 'achats';
export async function listPurchases() {
  const result = await getDocs(query(collection(firestore, name)));
  return result.docs.map((item) => { const data = item.data(); return { id: item.id, ...data, file_data: data.file_url || data.file_data }; }).sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
}
export async function savePurchase(purchase) {
  const id = crypto.randomUUID();
  if (!firebaseStorage || !purchase.file_data) {
    await runTransaction(firestore, async (transaction) => transaction.set(doc(firestore, name, id), { ...purchase, id, created_at: new Date().toISOString() }));
    return { ...purchase, id };
  }
  const { file_data: fileData, ...metadata } = purchase;
  const response = await fetch(fileData);
  const blob = await response.blob();
  const storagePath = `tickets/${purchase.user_id}/${id}.pdf`;
  const storageReference = ref(firebaseStorage, storagePath);
  await uploadBytes(storageReference, blob, { contentType: 'application/pdf' });
  try {
    const fileUrl = await getDownloadURL(storageReference);
    const saved = { ...metadata, file_url: fileUrl, storage_path: storagePath, id, created_at: new Date().toISOString() };
    await runTransaction(firestore, async (transaction) => transaction.set(doc(firestore, name, id), saved));
    return { ...saved, file_data: fileUrl };
  } catch (error) {
    await deleteObject(storageReference).catch(() => {});
    throw error;
  }
}
export async function deletePurchase(id) {
  const reference = doc(firestore, name, id);
  const snapshot = await getDoc(reference);
  await deleteDoc(reference);
  if (firebaseStorage && snapshot.data()?.storage_path) await deleteObject(ref(firebaseStorage, snapshot.data().storage_path)).catch(() => {});
}
export async function updatePurchaseInventory(id, inventory) { await updateDoc(doc(firestore, name, id), { inventory, inventory_updated_at: new Date().toISOString() }); }
