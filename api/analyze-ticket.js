/* global process */

const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyALS0RP2ri_h5Z_H839hQYPl6LgQWSSFNk';

const schema = { type: 'object', additionalProperties: false, required: ['supplier', 'date', 'total_eur', 'items'], properties: { supplier: { type: 'string' }, date: { type: 'string' }, total_eur: { type: ['number', 'null'] }, items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'quantity', 'unit_price_eur', 'line_total_eur', 'discount_eur', 'net_unit_price_eur'], properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit_price_eur: { type: ['number', 'null'] }, line_total_eur: { type: ['number', 'null'] }, discount_eur: { type: ['number', 'null'] }, net_unit_price_eur: { type: ['number', 'null'] } } } } } };

function outputText(payload) { return payload.output_text || payload.output?.flatMap((entry) => entry.content || []).find((entry) => entry.type === 'output_text')?.text; }

async function verifyFirebaseToken(token) {
  const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) });
  if (!verification.ok) throw new Error('Jeton Firebase invalide.');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Méthode non autorisée.' });
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: 'Analyse Vision non configurée.' });
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return response.status(401).json({ error: 'Connexion requise.' });
    await verifyFirebaseToken(token);
    const images = request.body?.images;
    if (!Array.isArray(images) || !images.length) return response.status(400).json({ error: 'Ajoute au moins une photo.' });
    if (images.length > 10) return response.status(400).json({ error: 'Maximum 10 photos par ticket.' });
    if (images.some((image) => typeof image !== 'string' || !image.startsWith('data:image/'))) return response.status(400).json({ error: 'Format d’image invalide.' });
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini', input: [{ role: 'user', content: [{ type: 'input_text', text: 'Analyse toutes ces photos comme les pages d’un seul ticket de caisse français. Extrais le magasin, la date, le total et chaque produit. Une ligne « 12 x 0,99 € » signifie quantité 12 et prix unitaire 0,99 €. Ignore les titres de rayon, TVA, paiements et totaux. N’invente rien : utilise null ou une chaîne vide si une valeur est illisible.' }, ...images.map((image) => ({ type: 'input_image', image_url: image, detail: 'high' }))] }], text: { format: { type: 'json_schema', name: 'ticket_inventory', strict: true, schema } } }) });
    const payload = await openaiResponse.json();
    if (!openaiResponse.ok) return response.status(openaiResponse.status).json({ error: payload.error?.message || 'Analyse Vision impossible.' });
    const text = outputText(payload);
    if (!text) throw new Error('Réponse Vision vide.');
    return response.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error('Ticket vision error:', error.message);
    return response.status(500).json({ error: 'Impossible d’analyser ce ticket.' });
  }
}
