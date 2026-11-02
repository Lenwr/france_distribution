import { test, expect } from '@playwright/test';
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

test('sans connexion : stock, commande, réception, vente, reçu et persistance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Se déconnecter' })).toHaveCount(0);
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
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('france-distribution:data:v1')));
  expect(state.articles.ean_12345678.quantity).toBe(3);
  expect(Object.keys(state.ventes)).toHaveLength(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le reçu' }).click();
  expect((await download).suggestedFilename()).toMatch(/^recu-.*\.pdf$/);
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('cell', { name: 'Riz 12345678', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('ventes concurrentes : pas de stock négatif et aucun enregistrement partiel', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { localDatabase: db, doc, runTransaction } = await import('/src/services/dataStore.js');
    const { createArticle, finalizeSale } = await import('/src/services/inventoryService.js');
    const article = await createArticle(db, { name: 'Test', price: 10, sell_price: 20 });
    await runTransaction(db, tx => tx.update(doc(db, 'articles', article.id), { quantity: 1 }));
    const items = [{ ...article, quantity: 1 }];
    const results = await Promise.allSettled([
      finalizeSale(db, 'sale-a', items, 'local'), finalizeSale(db, 'sale-b', items, 'local'),
    ]);
    const state = JSON.parse(localStorage.getItem('france-distribution:data:v1'));
    return { statuses: results.map(r => r.status).sort(), quantity: state.articles[article.id].quantity,
      sales: Object.keys(state.ventes).length, lines: Object.keys(state.ventes_details).length };
  });
  expect(result).toEqual({ statuses: ['fulfilled', 'rejected'], quantity: 0, sales: 1, lines: 1 });
});
