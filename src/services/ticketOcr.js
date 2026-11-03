const money = (value) => Number(String(value).replace(',', '.'));
export function parseTicketText(text) {
  const rows = String(text).split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean); const result = [];
  for (let index = 1; index < rows.length; index += 1) {
    const match = rows[index].match(/(\d+)\s*[xX×]\s*(\d+[,.]\d{2})\s*€?/);
    if (!match) continue;
    const name = rows[index - 1].replace(/^[>*#\-\s]+/, '').trim();
    if (!name || /total|remise|bon immédiat/i.test(name)) continue;
    result.push({ name, quantity: Number(match[1]), purchase_price: money(match[2]), promo_price: '', sale_price: '' });
  }
  return result;
}
export async function analyzeTicketImages(files) {
  const { createWorker } = await import('tesseract.js'); const worker = await createWorker('fra'); const lines = [];
  try { for (const file of files) { const result = await worker.recognize(file); lines.push(...parseTicketText(result.data.text)); } } finally { await worker.terminate(); }
  return lines;
}
