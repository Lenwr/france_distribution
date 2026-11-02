import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { addOrUpdateOrder, createArticle, deleteArticle, finalizeSale, receiveOrder, validPrice } from '../src/services/inventoryService.js';

let env;
let db;
const article = { name: 'Riz', price: 50, sell_price: 100, quantity: 10, code_ref: '12345678' };
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Les tests nécessitent l’émulateur : npm run test:emulator');
  env = await initializeTestEnvironment({ projectId: 'demo-france-distribution', firestore: { rules: await readFile('firestore.rules', 'utf8') } });
  db = env.authenticatedContext('admin').firestore();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'profiles', 'admin'), { role: 'admin', username: 'Admin' });
    await setDoc(doc(context.firestore(), 'profiles', 'user'), { role: 'user', username: 'User' });
    await setDoc(doc(context.firestore(), 'articles', 'rice'), article);
  });
});
after(async () => { await env?.cleanup(); });
const item = (quantity = 3, id = 'rice', price = 100) => ({ id, quantity, sell_price: price });
const stock = async () => (await getDoc(doc(db, 'articles', 'rice'))).data().quantity;

test('un utilisateur ne peut ni créer un profil admin ni modifier son rôle', async () => {
  const user = env.authenticatedContext('user').firestore();
  await assertFails(updateDoc(doc(user, 'profiles', 'user'), { role: 'admin' }));
  await assertFails(setDoc(doc(env.authenticatedContext('new').firestore(), 'profiles', 'new'), { role: 'admin' }));
  await assertSucceeds(updateDoc(doc(user, 'profiles', 'user'), { username: 'Nouveau nom' }));
  await assertSucceeds(setDoc(doc(env.authenticatedContext('new').firestore(), 'profiles', 'new'), { username: 'Nouveau', role: 'user' }));
});

test('le profil propre est lisible, les autres profils et le stock sont protégés', async () => {
  const user = env.authenticatedContext('user').firestore();
  await assertSucceeds(getDoc(doc(user, 'profiles', 'user')));
  await assertFails(getDoc(doc(user, 'profiles', 'admin')));
  await assertFails(getDocs(collection(user, 'profiles')));
  await assertFails(getDocs(collection(user, 'articles')));
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'articles')));
});

test('un administrateur ne peut pas accidentellement supprimer son rôle', async () => {
  await assertFails(updateDoc(doc(db, 'profiles', 'admin'), { role: 'user' }));
});

test('création manuelle sans fournisseur avec stock à zéro', async () => {
  const result = await createArticle(db, { name: 'Lait', price: 10, sell_price: 15 });
  assert.equal(result.quantity, 0);
  assert.equal(result.suppliers, '');
  assert.equal((await getDoc(doc(db, 'articles', result.id))).data().sell_price, 15);
});

test('deux créations simultanées du même code-barres ne créent qu’un article', async () => {
  const payload = { name: 'Lait', price: 10, sell_price: 15, code_ref: '87654321' };
  const results = await Promise.allSettled([createArticle(db, payload), createArticle(db, payload)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
});

test('prix invalides refusés et précision monétaire conservée', async () => {
  for (const value of [undefined, '', NaN, Infinity, -1, 0, 'abc', 1.001]) assert.throws(() => validPrice(value));
  assert.equal(validPrice(0, true), 0);
  await updateDoc(doc(db, 'articles', 'rice'), { sell_price: 0.1 });
  const sale = await finalizeSale(db, 'decimal', [item(3, 'rice', 0.1)], 'admin');
  assert.equal(sale.total, 0.3);
});

test('vente atomique : en-tête, lignes et stock sont cohérents', async () => {
  const sale = await finalizeSale(db, 'sale-1', [item()], 'admin');
  assert.equal(sale.total, 300);
  assert.equal(await stock(), 7);
  assert.equal((await getDocs(collection(db, 'ventes_details'))).size, 1);
});

test('deux caisses concurrentes déduisent toutes les unités vendues', async () => {
  await Promise.all([finalizeSale(db, 'sale-a', [item()], 'admin'), finalizeSale(db, 'sale-b', [item()], 'admin')]);
  assert.equal(await stock(), 4);
});

test('concurrence sur le dernier stock : une seule vente est acceptée', async () => {
  const results = await Promise.allSettled([finalizeSale(db, 'sale-a', [item(7)], 'admin'), finalizeSale(db, 'sale-b', [item(7)], 'admin')]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await stock(), 3);
  assert.equal((await getDocs(collection(db, 'ventes'))).size, 1);
});

test('un double clic ou une nouvelle tentative ne duplique pas la vente', async () => {
  await Promise.all([finalizeSale(db, 'same-sale', [item()], 'admin'), finalizeSale(db, 'same-sale', [item()], 'admin')]);
  await finalizeSale(db, 'same-sale', [item()], 'admin');
  assert.equal(await stock(), 7);
  assert.equal((await getDocs(collection(db, 'ventes_details'))).size, 1);
});

test('échec sur une ligne : aucune vente ni modification partielle', async () => {
  await assert.rejects(finalizeSale(db, 'failed-sale', [item(), item(1, 'missing')], 'admin'));
  assert.equal(await stock(), 10);
  assert.equal((await getDocs(collection(db, 'ventes'))).size, 0);
  assert.equal((await getDocs(collection(db, 'ventes_details'))).size, 0);
});

test('prix modifié et quantités invalides bloquent la vente', async () => {
  await assert.rejects(finalizeSale(db, 'bad-price', [item(1, 'rice', 90)], 'admin'));
  for (const quantity of [-1, 0, 1.5, NaN]) await assert.rejects(finalizeSale(db, 'bad-quantity', [item(quantity)], 'admin'));
  assert.equal(await stock(), 10);
});

test('commandes concurrentes et nouvelle tentative conservent le total et l’historique', async () => {
  await Promise.all([addOrUpdateOrder(db, { idArticle: 'rice', quantity: 3 }, 'order-a', 'admin'), addOrUpdateOrder(db, { idArticle: 'rice', quantity: 4 }, 'order-b', 'admin')]);
  await addOrUpdateOrder(db, { idArticle: 'rice', quantity: 3 }, 'order-a', 'admin');
  assert.equal((await getDoc(doc(db, 'commandes', 'rice'))).data().quantity, 7);
  assert.equal((await getDocs(collection(db, 'commandes_historique'))).size, 2);
});

test('réception partielle puis complète avec tentatives répétées', async () => {
  await addOrUpdateOrder(db, { idArticle: 'rice', quantity: 5 }, 'order', 'admin');
  await receiveOrder(db, 'rice', 2, 'receipt-a', 'admin');
  await receiveOrder(db, 'rice', 2, 'receipt-a', 'admin');
  assert.equal(await stock(), 12);
  assert.equal((await getDoc(doc(db, 'commandes', 'rice'))).data().quantity, 3);
  await receiveOrder(db, 'rice', 3, 'receipt-b', 'admin');
  await receiveOrder(db, 'rice', 3, 'receipt-b', 'admin');
  assert.equal(await stock(), 15);
  assert.equal((await getDoc(doc(db, 'commandes', 'rice'))).exists(), false);
});

test('deux réceptions concurrentes ne créditent pas la même commande deux fois', async () => {
  await addOrUpdateOrder(db, { idArticle: 'rice', quantity: 5 }, 'order', 'admin');
  const results = await Promise.allSettled([receiveOrder(db, 'rice', 5, 'receipt-a', 'admin'), receiveOrder(db, 'rice', 5, 'receipt-b', 'admin')]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await stock(), 15);
});

test('une réception excessive ne modifie ni le stock ni la commande', async () => {
  await addOrUpdateOrder(db, { idArticle: 'rice', quantity: 5 }, 'order', 'admin');
  await assert.rejects(receiveOrder(db, 'rice', 6, 'receipt', 'admin'));
  assert.equal(await stock(), 10);
  assert.equal((await getDoc(doc(db, 'commandes', 'rice'))).data().quantity, 5);
});

test('les règles refusent stocks négatifs et ventes incomplètes', async () => {
  await assertFails(updateDoc(doc(db, 'articles', 'rice'), { quantity: -1 }));
  await assertFails(updateDoc(doc(db, 'articles', 'rice'), { sell_price: -1 }));
  await assertFails(setDoc(doc(db, 'ventes', 'draft'), { total: 0 }));
});

test('suppression interdite avec stock ou commande en cours', async () => {
  await assert.rejects(deleteArticle(db, 'rice'));
  await updateDoc(doc(db, 'articles', 'rice'), { quantity: 0 });
  await addOrUpdateOrder(db, { idArticle: 'rice', quantity: 1 }, 'order', 'admin');
  await assert.rejects(deleteArticle(db, 'rice'));
  const empty = await createArticle(db, { name: 'Vide', price: 0, sell_price: 1 });
  await deleteArticle(db, empty.id);
  assert.equal((await getDoc(doc(db, 'articles', empty.id))).exists(), false);
});

test('vente remisée : montants persistés, prix catalogue et stock conservés correctement', async () => {
  await setDoc(doc(db, 'articles', 'oil'), { ...article, name: 'Huile', sell_price: 200 });
  const sale = await finalizeSale(db, 'discount-sale', [
    { ...item(3), discount_type: 'percent', discount_value: 10 },
    { ...item(2, 'oil', 200), discount_type: 'amount', discount_value: 50 },
  ], 'admin');
  assert.equal(sale.gross_total, 700);
  assert.equal(sale.discount_total, 80);
  assert.equal(sale.total, 620);
  assert.equal(sale.items[0].discount_amount, 30);
  assert.equal(sale.items[1].discount_amount, 50);
  const detail = (await getDoc(doc(db, 'ventes_details', 'discount-sale_rice'))).data();
  assert.equal(detail.total, 270);
  assert.equal(detail.discount_value, 10);
  assert.equal(await stock(), 7);
  assert.equal((await getDoc(doc(db, 'articles', 'rice'))).data().sell_price, 100);
  await finalizeSale(db, 'discount-sale', [{ ...item(3), discount_value: 10 }], 'admin');
  assert.equal(await stock(), 7);
});
test('remise excessive : aucune écriture ; remise de 100 % : stock déduit une fois', async () => {
  await assert.rejects(finalizeSale(db, 'bad-discount', [{ ...item(), discount_type: 'amount', discount_value: 301 }], 'admin'));
  assert.equal(await stock(), 10);
  assert.equal((await getDocs(collection(db, 'ventes'))).size, 0);
  const sale = await finalizeSale(db, 'free-sale', [{ ...item(), discount_value: 100 }], 'admin');
  assert.equal(sale.total, 0);
  assert.equal(sale.discount_total, 300);
  assert.equal(await stock(), 7);
});
test('règles : rejet d’un total négatif ou de remises supérieures au brut', async () => {
  const base = { status: 'completed', user_id: 'admin', items: [{}], gross_cents: 10000, gross_total: 100 };
  await assertFails(setDoc(doc(db, 'ventes', 'negative'), { ...base, total: -1, total_cents: -100, discount_total: 101, discount_cents: 10100 }));
  await assertFails(setDoc(doc(db, 'ventes', 'inconsistent'), { ...base, total: 80, total_cents: 8000, discount_total: 30, discount_cents: 3000 }));
});
