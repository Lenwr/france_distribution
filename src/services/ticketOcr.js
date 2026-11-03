const money = (value) => Number(String(value).replace(',', '.'));
export function parseTicketText(text) {
  const rows = String(text).split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean); const result = [];
  for (let index = 1; index < rows.length; index += 1) {
    const match = rows[index].match(/(\d+)\s*[xX×]\s*(\d+[,.]\d{2})\s*€?/);
    if (!match) continue;
    const candidates = rows.slice(Math.max(0, index - 4), index).reverse();
    const rawName = candidates.find((line) => /[A-ZÀ-Ü]{3}/i.test(line) && !/^\W*\d/.test(line) && !/total|remise|bon immédiat|épicerie|alcools|tva|ttc/i.test(line)) || rows[index - 1];
    const name = rawName.replace(/^[>*#=._\-\s]+/, '').replace(/\s+\d+[,.]\d{2}\s*\d?$/, '').trim();
    if (!name || /total|remise|bon immédiat/i.test(name)) continue;
    result.push({ name, quantity: Number(match[1]), purchase_price: money(match[2]), promo_price: '', sale_price: '' });
  }
  return result;
}
async function enhanceImage(file) {
  const bitmap = await createImageBitmap(file); const maxWidth = 1800; const scale = Math.min(2, maxWidth / bitmap.width); const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale); const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); const image = context.getImageData(0, 0, canvas.width, canvas.height); for (let index = 0; index < image.data.length; index += 4) { const gray = image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114; const value = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 145)); image.data[index] = value; image.data[index + 1] = value; image.data[index + 2] = value; } context.putImageData(image, 0, 0); return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', .94));
}
export async function analyzeTicketImages(files) {
  const { createWorker, PSM } = await import('tesseract.js'); const worker = await createWorker('fra'); await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1' }); const lines = [];
  try { for (const file of files) { const enhanced = await enhanceImage(file); const result = await worker.recognize(enhanced); lines.push(...parseTicketText(result.data.text)); } } finally { await worker.terminate(); }
  return lines;
}
