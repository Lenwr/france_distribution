const FALLBACK_XOF_PER_EUR = 655.957;
const cachedRate = Number(localStorage.getItem('france-distribution:xof-per-eur'));
let xofPerEur = Number.isFinite(cachedRate) && cachedRate > 0 ? cachedRate : FALLBACK_XOF_PER_EUR;

export function formatXof(value) { return `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} FCFA`; }
export function formatEurFromXof(value) { return (Number(value || 0) / xofPerEur).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }); }
export function formatDualCurrency(value) { return `${formatXof(value)} · ${formatEurFromXof(value)}`; }
export function formatPurchaseEur(value) { return `${Number(value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })} · ${formatXof(Number(value || 0) * xofPerEur)}`; }
export function getXofPerEur() { return xofPerEur; }

export async function refreshExchangeRate() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (!response.ok) throw new Error('Taux indisponible');
    const data = await response.json();
    const rate = Number(data.rates?.XOF);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Taux XOF indisponible');
    xofPerEur = rate;
    localStorage.setItem('france-distribution:xof-per-eur', String(rate));
    window.dispatchEvent(new Event('currency-rate-updated'));
  } catch { /* Le taux de secours permet de continuer hors connexion. */ }
  return xofPerEur;
}
