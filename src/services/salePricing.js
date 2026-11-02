// Store monetary calculations as integer hundredths, matching existing prices.
export function calculateSaleLine({ quantity, sell_price, discount_type = 'percent', discount_value = 0 }) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('La quantité doit être un entier positif.');
  const price = decimal(sell_price, 'Prix unitaire');
  if (price <= 0) throw new Error('Le prix unitaire doit être positif.');
  if (!['percent', 'amount'].includes(discount_type)) throw new Error('Type de remise invalide.');
  const discount = decimal(discount_value, 'Remise');
  const grossCents = Math.round(price * 100) * quantity;
  if (!Number.isSafeInteger(grossCents) || grossCents >= 100000000000000) throw new Error('Le montant de la ligne est trop élevé.');
  if (discount_type === 'percent' && discount > 100) throw new Error('La remise ne peut pas dépasser 100 %.');
  // BigInt preserves exact rounding even for large quantities and percentages.
  const discountCents = discount_type === 'amount' ? Math.round(discount * 100)
    : Number((BigInt(grossCents) * BigInt(Math.round(discount * 100)) + 5000n) / 10000n);
  if (discountCents > grossCents) throw new Error('La remise ne peut pas dépasser le total de la ligne.');
  return {
    discount_type, discount_value: discount,
    gross_cents: grossCents, discount_cents: discountCents, total_cents: grossCents - discountCents,
    gross_total: grossCents / 100, discount_amount: discountCents / 100, total: (grossCents - discountCents) / 100,
  };
}

function decimal(value, label) {
  const number = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || number >= 1000000000000
    || Math.abs(number * 100 - Math.round(number * 100)) > 0.00001) {
    throw new Error(`${label} : saisissez une valeur positive ou nulle avec au maximum deux décimales.`);
  }
  return number;
}

export function summarizeSale(lines) {
  const summary = lines.reduce((sum, line) => ({
    gross_cents: sum.gross_cents + line.gross_cents,
    discount_cents: sum.discount_cents + line.discount_cents,
    total_cents: sum.total_cents + line.total_cents,
  }), { gross_cents: 0, discount_cents: 0, total_cents: 0 });
  if (!Number.isSafeInteger(summary.gross_cents) || summary.gross_cents >= 100000000000000) throw new Error('Le montant de la vente est trop élevé.');
  return { ...summary, gross_total: summary.gross_cents / 100, discount_total: summary.discount_cents / 100, total: summary.total_cents / 100 };
}

export function discountLabel(line) {
  const amount = line.discount_amount ?? 0;
  return line.discount_type === 'percent' ? `${line.discount_value} % (${amount.toFixed(2)} FCFA)` : `${amount.toFixed(2)} FCFA`;
}
