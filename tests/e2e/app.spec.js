import { test, expect } from '@playwright/test';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'demo-france-distribution';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const app = initializeApp({ projectId }, 'browser-tests');
const db = getFirestore(app);
const auth = getAuth(app);
const password = 'Only-for-local-tests-123!';

test.beforeEach(async () => {
  for (const url of [
    `http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`,
  ]) {
    const response = await fetch(url, { method: 'DELETE' });
    expect(response.ok).toBeTruthy();
  }
  await auth.createUser({ uid: 'admin', email: 'admin@example.test', password });
  await db.doc('profiles/admin').set({ role: 'admin', username: 'Admin' });
});
async function login(page, email = 'admin@example.test') {
  await page.goto('/login');
  await page.screenshot({ path: 'test-results/design-login.png', fullPage: true });
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function createProduct(page, name, barcode) {
  await page.getByRole('button', { name: 'Créer un article' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Code-barres (facultatif)').fill(barcode);
  await modal.getByLabel('Nom de l’article').fill(name);
  await modal.getByLabel('Prix d’achat (FCFA)').fill('10');
  await modal.getByLabel('Prix de vente (FCFA)').fill('20');
  await modal.getByRole('button', { name: 'Ajouter l’article' }).click();
  await expect(modal.getByRole('status')).toContainText('Article ajouté');
  await modal.getByRole('button', { name: 'Fermer', exact: true }).click();
}

test('base vide → article → commande → réception → vente → reçu → déconnexion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  await expect(page.getByText('Votre stock est vide.', { exact: false })).toBeVisible();
  await createProduct(page, 'Riz', '12345678');
  await page.screenshot({ path: 'test-results/design-stock.png', fullPage: true });
  await page.getByRole('button', { name: 'Mes commandes', exact: true }).click();
  await page.getByRole('button', { name: 'Nouvelle commande', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Article', exact: true }).selectOption({ label: 'Riz' });
  await dialog.getByLabel('Quantité', { exact: true }).fill('5');
  await dialog.getByRole('button', { name: 'Ajouter la commande' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Commande enregistrée.');
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.getByRole('button', { name: 'Réceptionner', exact: true }).click();
  await dialog.getByLabel('Quantité reçue').fill('5');
  await dialog.getByRole('button', { name: 'Réceptionner', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('Commande réceptionnée avec succès.')).toBeVisible();
  await page.goto('/sales');
  await page.getByRole('button', { name: 'Démarrer une vente' }).click();
  await page.getByLabel('Code-barres', { exact: true }).fill('12345678');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.getByLabel('Quantité de Riz').fill('2');
  await page.getByRole('button', { name: 'Finaliser la vente' }).click();
  await expect(page.getByText('Vente enregistrée.', { exact: false })).toBeVisible();
  expect((await db.doc('articles/ean_12345678').get()).data().quantity).toBe(3);
  expect((await db.collection('ventes').get()).size).toBe(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le reçu' }).click();
  expect((await download).suggestedFilename()).toMatch(/^recu-.*\.pdf$/);
  await page.goto('/profile');
  await page.getByLabel('Nom', { exact: true }).fill('Admin modifié');
  await page.getByRole('button', { name: 'Mettre à jour' }).click();
  await expect(page.getByRole('status')).toHaveText('Profil mis à jour.');
  expect((await db.doc('profiles/admin').get()).data().role).toBe('admin');
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/sales');
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('modification des prix cible bien le produit choisi et les styles sont présents sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await createProduct(page, 'Riz', '12345678');
  await createProduct(page, 'Lait', '87654321');
  await page.getByRole('button', { name: 'Modifier Riz', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Prix de vente (FCFA)').fill('25');
  await dialog.getByRole('button', { name: 'Enregistrer le prix de vente' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Prix enregistré.');
  await dialog.getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('button', { name: 'Modifier Lait', exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Prix de vente (FCFA)')).toHaveValue('20');
  await dialog.getByLabel('Prix de vente (FCFA)').fill('30');
  await dialog.getByRole('button', { name: 'Enregistrer le prix de vente' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Prix enregistré.');
  expect((await db.doc('articles/ean_12345678').get()).data().sell_price).toBe(25);
  expect((await db.doc('articles/ean_87654321').get()).data().sell_price).toBe(30);
  const box = await dialog.locator('.modal-box').boundingBox();
  expect(box.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/mobile-product.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Fermer' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('utilisateur non admin : connexion autorisée, gestion du stock interdite', async ({ page }) => {
  await auth.createUser({ uid: 'user', email: 'user@example.test', password });
  await db.doc('profiles/user').set({ role: 'user', username: 'Utilisateur' });
  await login(page, 'user@example.test');
  await expect(page.getByRole('heading', { name: 'Accès réservé aux administrateurs' })).toBeVisible();
  await page.getByRole('link', { name: 'Mon profil' }).click();
  await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Utilisateur');
});

test('ancien localStorage corrompu et révocation du rôle ne laissent pas de fausse session', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('user', '{broken'); localStorage.setItem('role', 'admin'); });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Gestion du stock' })).toBeVisible();
  await db.doc('profiles/admin').update({ role: 'user' });
  await expect(page.getByRole('heading', { name: 'Accès réservé aux administrateurs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gestion du stock' })).not.toBeVisible();
});

test('remises par produit : calcul, rescan, restauration et reçu', async ({ page }) => {
  await db.doc('articles/rice').set({ name: 'Riz', quantity: 20, price: 500, sell_price: 1000, code_ref: '12345678' });
  await db.doc('articles/oil').set({ name: 'Huile', quantity: 20, price: 1000, sell_price: 2000, code_ref: '87654321' });
  await login(page);
  await page.goto('/sales');
  await page.getByRole('button', { name: 'Démarrer une vente' }).click();
  const scan = async (code) => {
    await page.getByLabel('Code-barres', { exact: true }).fill(code);
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
    await expect(page.getByLabel('Code-barres', { exact: true })).toHaveValue('');
  };
  await scan('12345678');
  await page.getByLabel('Quantité de Riz').fill('9');
  await page.getByLabel('Remise pour Riz', { exact: true }).fill('10');
  await scan('12345678');
  await expect(page.getByLabel('Remise pour Riz', { exact: true })).toHaveValue('10');
  await expect(page.getByLabel('Quantité de Riz')).toHaveValue('10');
  await scan('87654321');
  await page.getByLabel('Quantité de Huile').fill('5');
  await page.getByLabel('Type de remise pour Huile').selectOption('amount');
  await page.getByLabel('Remise pour Huile', { exact: true }).fill('10001');
  await expect(page.getByRole('button', { name: 'Finaliser la vente' })).toBeDisabled();
  await expect(page.getByText('La remise ne peut pas dépasser le total de la ligne.')).toBeVisible();
  await page.getByLabel('Remise pour Huile', { exact: true }).fill('500');
  await expect(page.getByText('Net à payer : 18500.00 FCFA', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/design-caisse.png', fullPage: true });
  await page.reload();
  await expect(page.getByLabel('Remise pour Huile', { exact: true })).toHaveValue('500');
  await expect(page.getByText('Net à payer : 18500.00 FCFA', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finaliser la vente' }).click();
  await expect(page.getByText('Vente enregistrée.', { exact: false })).toBeVisible();
  const sale = (await db.collection('ventes').get()).docs[0].data();
  expect(sale.total).toBe(18500);
  expect(sale.discount_total).toBe(1500);
  expect((await db.doc('articles/rice').get()).data().quantity).toBe(10);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le reçu' }).click();
  expect((await download).suggestedFilename()).toMatch(/^recu-.*\.pdf$/);
});
