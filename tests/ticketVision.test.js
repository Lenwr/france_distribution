import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnalysis } from '../api/analyze-ticket.js';

test('calculates the promotional unit price from the lot discount', () => {
  const result = normalizeAnalysis({ items: [{ name: 'HEINEKEN', quantity: 6, unit_price_eur: 10.35, line_total_eur: 46.57, discount_eur: 15.53, net_unit_price_eur: 10.35 }] });
  assert.deepEqual(result.items[0], { name: 'HEINEKEN', quantity: 6, unit_price_eur: 10.35, line_total_eur: 62.1, discount_eur: 15.53, net_unit_price_eur: 7.76 });
});

test('keeps free promotional products with a zero net price', () => {
  const result = normalizeAnalysis({ items: [{ name: 'PRINGLES', quantity: 1, unit_price_eur: 1.95, line_total_eur: 0, discount_eur: 1.95, net_unit_price_eur: null }] });
  assert.equal(result.items[0].net_unit_price_eur, 0);
});

test('leaves the promo price empty when there is no discount', () => {
  const result = normalizeAnalysis({ items: [{ name: 'BICARBONATE', quantity: 7, unit_price_eur: 1.98, line_total_eur: 13.86, discount_eur: null, net_unit_price_eur: 1.98 }] });
  assert.equal(result.items[0].net_unit_price_eur, null);
});
