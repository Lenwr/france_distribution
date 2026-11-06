import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAnalysis } from "../api/analyze-ticket.js";

test("calculates the promotional unit price from the lot discount", () => {
  const result = normalizeAnalysis({
    items: [
      {
        name: "HEINEKEN",
        quantity: 6,
        unit_price_eur: 10.35,
        line_total_eur: 46.57,
        discount_eur: 15.53,
        net_unit_price_eur: 10.35,
      },
    ],
  });
  assert.equal(result.items[0].quantity, 6);
  assert.equal(result.items[0].unit_price_eur, 10.35);
  assert.equal(result.items[0].line_total_eur, 62.1);
  assert.equal(result.items[0].discount_eur, 15.53);
  assert.equal(result.items[0].net_unit_price_eur, 7.76);
});

test("keeps free promotional products with a zero net price", () => {
  const result = normalizeAnalysis({
    items: [
      {
        name: "PRINGLES",
        quantity: 1,
        unit_price_eur: 1.95,
        line_total_eur: 0,
        discount_eur: 1.95,
        net_unit_price_eur: null,
      },
    ],
  });
  assert.equal(result.items[0].net_unit_price_eur, 0);
});

test("leaves the promo price empty when there is no discount", () => {
  const result = normalizeAnalysis({
    items: [
      {
        name: "BICARBONATE",
        quantity: 7,
        unit_price_eur: 1.98,
        line_total_eur: 13.86,
        discount_eur: null,
        net_unit_price_eur: 1.98,
      },
    ],
  });
  assert.equal(result.items[0].net_unit_price_eur, null);
});

test("validates a coherent ticket total and item count", () => {
  const result = normalizeAnalysis({
    total_eur: 13.86,
    receipt_item_count: 7,
    items: [
      {
        name: "BICARBONATE",
        quantity: 7,
        unit_price_eur: 1.98,
        line_total_eur: 13.86,
        discount_eur: null,
        net_unit_price_eur: null,
        confidence: "high",
      },
    ],
  });
  assert.equal(result.validation.status, "ok");
  assert.equal(result.validation.computed_total_eur, 13.86);
  assert.equal(result.validation.computed_item_count, 7);
});

test("flags total, quantity and low-confidence differences without changing values", () => {
  const result = normalizeAnalysis({
    total_eur: 10,
    receipt_item_count: 4,
    items: [
      {
        name: "PRODUIT",
        quantity: 2,
        unit_price_eur: 3,
        line_total_eur: 6,
        discount_eur: null,
        net_unit_price_eur: null,
        confidence: "low",
      },
    ],
  });
  assert.equal(result.validation.status, "warning");
  assert.equal(result.validation.total_difference_eur, 4);
  assert.equal(result.validation.item_count_difference, 2);
  assert.equal(result.items[0].review_required, true);
  assert.equal(result.items[0].unit_price_eur, 3);
});
