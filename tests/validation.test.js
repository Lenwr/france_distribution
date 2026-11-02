import assert from 'node:assert/strict';
import { test } from 'node:test';
import { positiveQuantity, validPrice } from '../src/services/inventoryService.js';
test('quantités : refuse zéro, décimales, valeurs non finies et débordements', () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '3']) assert.throws(() => positiveQuantity(value));
  assert.equal(positiveQuantity(3), 3);
});
test('prix : validation des saisies vides, négatives et décimales', () => {
  for (const value of ['', ' ', null, undefined, -1, NaN, Infinity, '1.001']) assert.throws(() => validPrice(value));
  assert.equal(validPrice('12.34'), 12.34);
  assert.equal(validPrice('0', true), 0);
});

import { calculateSaleLine, summarizeSale } from '../src/services/salePricing.js';
test('remises indépendantes en pourcentage et en FCFA', () => {
  const rice = calculateSaleLine({ quantity: 10, sell_price: 1000, discount_type: 'percent', discount_value: 10 });
  const oil = calculateSaleLine({ quantity: 5, sell_price: 2000, discount_type: 'amount', discount_value: 500 });
  assert.equal(rice.total, 9000);
  assert.equal(oil.total, 9500);
  const totals = summarizeSale([rice, oil]);
  assert.equal(totals.gross_total, 20000);
  assert.equal(totals.discount_total, 1500);
  assert.equal(totals.total, 18500);
});
test('remise absente, totale et arrondi au centième', () => {
  assert.equal(calculateSaleLine({ quantity: 3, sell_price: 0.1 }).total, 0.3);
  assert.equal(calculateSaleLine({ quantity: 1, sell_price: 1, discount_value: 100 }).total, 0);
  assert.equal(calculateSaleLine({ quantity: 1, sell_price: 0.05, discount_value: 10 }).discount_amount, 0.01);
});
test('les remises invalides ne deviennent pas silencieusement zéro', () => {
  for (const discount_value of [-1, '', ' ', NaN, Infinity, 100.01, 'abc', 1.001]) {
    assert.throws(() => calculateSaleLine({ quantity: 2, sell_price: 500, discount_value }));
  }
  assert.throws(() => calculateSaleLine({ quantity: 2, sell_price: 500, discount_type: 'amount', discount_value: 1001 }));
  assert.throws(() => calculateSaleLine({ quantity: 2, sell_price: 500, discount_type: 'other' }));
});
test('changer la quantité recalcule le pourcentage et conserve la remise fixe de ligne', () => {
  assert.equal(calculateSaleLine({ quantity: 3, sell_price: 100, discount_value: 10 }).total, 270);
  assert.equal(calculateSaleLine({ quantity: 3, sell_price: 100, discount_type: 'amount', discount_value: 20 }).total, 280);
  assert.throws(() => calculateSaleLine({ quantity: 1, sell_price: 100, discount_type: 'amount', discount_value: 200 }));
});
