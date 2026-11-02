import { calculateSaleLine, summarizeSale } from './salePricing.js';
import { collection, doc, getDocFromServer, getDocs, limit, query, runTransaction, where } from './dataStore.js';

export function positiveQuantity(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('La quantité doit être un entier positif.');
  return value;
}

export function validPrice(value, allowZero = false) {
  const price = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (typeof price !== 'number' || !Number.isFinite(price) || (allowZero ? price < 0 : price <= 0)
    || price >= 1000000000000 || !Number.isSafeInteger(Math.round(price * 100)) || Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) {
    throw new Error('Saisissez un prix valide, avec au maximum deux décimales.');
  }
  return price;
}

export async function applyPurchaseInventory(db, lines) {
  if (!Array.isArray(lines) || !lines.length) throw new Error('Ajoutez au moins une ligne à l’inventaire.');
  const normalized = lines.map((line) => ({ id: line.id, quantity: positiveQuantity(Number(line.quantity)) }));
  if (new Set(normalized.map((line) => line.id)).size !== normalized.length) throw new Error('Un article apparaît plusieurs fois.');
  return runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(normalized.map((line) => transaction.get(doc(db, 'articles', line.id))));
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) throw new Error('Un article de l’inventaire est introuvable.');
      const article = snapshot.data(); const quantity = stockOf(article) + normalized[index].quantity;
      transaction.update(snapshot.ref, { quantity, updated_at: new Date().toISOString() });
      transaction.set(doc(db, 'catalogue_public', snapshot.id), publicArticle({ ...article, quantity }));
    });
  });
}

function stockOf(article) {
  const stock = Number(article.quantity ?? 0);
  if (!Number.isSafeInteger(stock) || stock < 0) throw new Error('Le stock de cet article est invalide.');
  return stock;
}

function publicArticle(article) {
  return { name: article.name, image: article.image || article.avatar_url || '', category: article.category || article.suppliers || '', sell_price: article.sell_price, available: Number(article.quantity || 0) > 0, code_ref: article.code_ref || '', updated_at: new Date().toISOString() };
}

// The sale ID is created once by the caller and reused after a failed request.
// Reading the completed sale inside the transaction makes retries idempotent.
export async function finalizeSale(db, saleId, items, userId, payment = {}) {
  if (!saleId || !userId || !items.length) throw new Error('La vente est vide ou la session a expiré.');
  if (items.length > 100) throw new Error('Une vente ne peut pas dépasser 100 articles distincts.');
  const ids = new Set();
  for (const item of items) {
    positiveQuantity(item.quantity);
    calculateSaleLine(item);
    if (!item.id || ids.has(item.id)) throw new Error('Article invalide ou présent plusieurs fois.');
    ids.add(item.id);
  }
  const saleRef = doc(db, 'ventes', saleId);
  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(saleRef);
    if (existing.exists()) {
      if (existing.data().status !== 'completed' || existing.data().user_id !== userId) {
        throw new Error('Cette référence de vente est déjà utilisée.');
      }
      return { id: saleId, ...existing.data() };
    }
    const snapshots = await Promise.all(items.map((item) => transaction.get(doc(db, 'articles', item.id))));
    const lines = snapshots.map((snapshot, index) => {
      if (!snapshot.exists()) throw new Error('Un article a été supprimé.');
      const article = snapshot.data();
      const item = items[index];
      const price = validPrice(article.sell_price);
      if (price !== Number(item.sell_price)) throw new Error(`Le prix de ${article.name} a changé. Retirez puis ajoutez à nouveau cet article.`);
      if (stockOf(article) < item.quantity) throw new Error(`Stock insuffisant pour ${article.name}.`);
      const pricing = calculateSaleLine({ ...item, sell_price: price });
      return { id_article: snapshot.id, name: article.name, prix_unitaire: price, quantity: item.quantity, ...pricing };
    });
    const sale = { ...summarizeSale(lines), status: 'completed', user_id: userId, created_at: new Date().toISOString(), items: lines,
      payment_method: payment.method || 'cash', amount_received: Number(payment.amountReceived || 0), change_due: Number(payment.changeDue || 0) };
    transaction.set(saleRef, sale);
    lines.forEach((line, index) => {
      transaction.set(doc(db, 'ventes_details', `${saleId}_${line.id_article}`), { ...line, id_vente: saleId });
      transaction.update(snapshots[index].ref, { quantity: stockOf(snapshots[index].data()) - line.quantity });
      transaction.set(doc(db, 'catalogue_public', line.id_article), publicArticle({ ...snapshots[index].data(), quantity: stockOf(snapshots[index].data()) - line.quantity }));
    });
    return { id: saleId, ...sale };
  }).catch(async (error) => {
    // Rules may reject a competing create before the SDK retries the conflict.
    // An already committed sale with this operation ID is the successful result.
    const committed = await getDocFromServer(saleRef).catch(() => null);
    if (committed?.exists() && committed.data().status === 'completed' && committed.data().user_id === userId) {
      return { id: saleId, ...committed.data() };
    }
    throw error;
  });
}

export async function receiveOrder(db, orderId, quantity, operationId, userId) {
  positiveQuantity(quantity);
  if (!operationId || !userId) throw new Error('Session ou référence de réception manquante.');
  const orderRef = doc(db, 'commandes', orderId);
  const historyRef = doc(db, 'commandes_historique', operationId);
  return runTransaction(db, async (transaction) => {
    const previous = await transaction.get(historyRef);
    if (previous.exists()) {
      const data = previous.data();
      if (data.type !== 'reception' || data.id_commande !== orderId || data.user_id !== userId || data.quantity !== quantity) {
        throw new Error('Cette référence de réception est déjà utilisée.');
      }
      return;
    }
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) throw new Error('Cette commande a déjà été réceptionnée ou supprimée.');
    const order = orderSnapshot.data();
    if (quantity > positiveQuantity(Number(order.quantity))) throw new Error('La quantité dépasse le reste à réceptionner.');
    const articleRef = doc(db, 'articles', order.idArticle);
    const article = await transaction.get(articleRef);
    if (!article.exists()) throw new Error('Article introuvable.');
    const updatedStock = stockOf(article.data()) + quantity;
    if (!Number.isSafeInteger(updatedStock)) throw new Error('Le stock dépasse la quantité maximale.');
    transaction.update(articleRef, { quantity: updatedStock });
    transaction.set(doc(db, 'catalogue_public', article.id), publicArticle({ ...article.data(), quantity: updatedStock }));
    if (Number(order.quantity) === quantity) transaction.delete(orderRef);
    else transaction.update(orderRef, { quantity: Number(order.quantity) - quantity });
    transaction.set(historyRef, {
      type: 'reception', id_commande: orderId, id_article: article.id, name: article.data().name,
      quantity, date_commande: new Date().toISOString(), user_id: userId,
    });
  });
}

export async function addOrUpdateOrder(db, { idArticle, quantity }, operationId, userId) {
  positiveQuantity(quantity);
  if (!operationId || !userId) throw new Error('Session ou référence de commande manquante.');
  // Preserve existing randomly generated order IDs. New orders use the article ID
  // so two simultaneous creations contend on the same document.
  const matches = await getDocs(query(collection(db, 'commandes'), where('idArticle', '==', idArticle), limit(2)));
  if (matches.size > 1) throw new Error('Plusieurs commandes ouvertes existent pour cet article.');
  const orderRef = matches.empty ? doc(db, 'commandes', idArticle) : matches.docs[0].ref;
  const historyRef = doc(db, 'commandes_historique', operationId);
  return runTransaction(db, async (transaction) => {
    const previous = await transaction.get(historyRef);
    if (previous.exists()) {
      const data = previous.data();
      if (data.type !== 'commande' || data.id_article !== idArticle || data.quantity !== quantity || data.user_id !== userId) {
        throw new Error('Cette référence de commande est déjà utilisée.');
      }
      return data.order;
    }
    const article = await transaction.get(doc(db, 'articles', idArticle));
    const existing = await transaction.get(orderRef);
    if (!article.exists()) throw new Error('Article introuvable.');
    const updatedQuantity = (existing.exists() ? positiveQuantity(Number(existing.data().quantity)) : 0) + quantity;
    positiveQuantity(updatedQuantity);
    const order = { id: orderRef.id, idCommande: orderRef.id, idArticle, quantity: updatedQuantity, name: article.data().name, statut: 'En cours' };
    transaction.set(orderRef, order);
    transaction.set(historyRef, { type: 'commande', id_commande: orderRef.id, id_article: idArticle,
      quantity, name: order.name, date_commande: new Date().toISOString(), user_id: userId, order });
    return order;
  });
}

export async function createArticle(db, article) {
  if (!article.name?.trim()) throw new Error('Le nom de l’article est obligatoire.');
  const payload = { ...article, name: article.name.trim(), quantity: 0,
    price: validPrice(article.price, true), sell_price: validPrice(article.sell_price), suppliers: article.suppliers ?? '' };
  const code = String(article.code_ref ?? '').trim();
  if (code && !/^\d{8,14}$/.test(code)) throw new Error('Code-barres invalide.');
  payload.code_ref = code;
  // A stable ID enforces barcode uniqueness under concurrent creation.
  const ref = code ? doc(db, 'articles', `ean_${code}`) : doc(collection(db, 'articles'));
  if (code) {
    const duplicate = await getDocs(query(collection(db, 'articles'), where('code_ref', '==', code), limit(1)));
    if (!duplicate.empty) throw new Error('Un article possède déjà ce code-barres.');
  }
  return runTransaction(db, async (transaction) => {
    if ((await transaction.get(ref)).exists()) throw new Error('Un article possède déjà ce code-barres.');
    const data = { ...payload, id: ref.id, idArticle: ref.id };
    transaction.set(ref, data);
    transaction.set(doc(db, 'catalogue_public', ref.id), publicArticle(data));
    return data;
  });
}

export async function deleteArticle(db, id) {
  const matches = await getDocs(query(collection(db, 'commandes'), where('idArticle', '==', id), limit(1)));
  if (!matches.empty) throw new Error('Réceptionnez la commande en cours avant de supprimer cet article.');
  return runTransaction(db, async (transaction) => {
    const articleRef = doc(db, 'articles', id);
    const article = await transaction.get(articleRef);
    const pending = await transaction.get(doc(db, 'commandes', id));
    if (!article.exists()) throw new Error('Article introuvable.');
    if (pending.exists()) throw new Error('Une commande est en cours pour cet article.');
    if (stockOf(article.data()) > 0) throw new Error('Un article en stock ne peut pas être supprimé.');
    transaction.delete(articleRef);
    transaction.delete(doc(db, 'catalogue_public', id));
  });
}
