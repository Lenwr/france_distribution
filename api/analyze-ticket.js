/* global process */

const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyALS0RP2ri_h5Z_H839hQYPl6LgQWSSFNk';
const apiVersion = '2026-11-03.2';

const schema = { type: 'object', additionalProperties: false, required: ['supplier', 'date', 'total_eur', 'items'], properties: { supplier: { type: 'string' }, date: { type: 'string' }, total_eur: { type: ['number', 'null'] }, items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'quantity', 'unit_price_eur', 'line_total_eur', 'discount_eur', 'net_unit_price_eur'], properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit_price_eur: { type: ['number', 'null'] }, line_total_eur: { type: ['number', 'null'] }, discount_eur: { type: ['number', 'null'] }, net_unit_price_eur: { type: ['number', 'null'] } } } } } };

const analysisInstructions = `Analyse toutes les photos comme les parties successives d'un seul ticket de caisse français.
Les photos d'un ticket long peuvent se chevaucher : repère les lignes communes et ne compte chaque achat qu'une seule fois.
Extrais le magasin, la date au format YYYY-MM-DD, le total payé et les produits réellement achetés.
Une notation comme « 7*2,34 », « 7 x 2,34 € » ou « 7X2.34 » signifie quantité 7 et prix unitaire 2,34 €.
Quand un produit sans multiplicateur est suivi uniquement de son montant, utilise une quantité de 1.
Les sections « Articles avec remise », « Articles remisés » ou similaires récapitulent souvent des produits déjà listés : ne les ajoute jamais une seconde fois. Utilise-les uniquement pour renseigner discount_eur et net_unit_price_eur du produit correspondant lorsque l'association est certaine.
Ignore les titres de rayon, sous-totaux, TVA, moyens de paiement, fidélité, codes-barres et lignes administratives.
Regroupe les lignes strictement identiques d'un même produit lorsque cela est sans ambiguïté, en additionnant leurs quantités.
N'invente rien : utilise null ou une chaîne vide si une valeur est illisible ou incertaine.`;

function outputText(payload) { return payload.output_text || payload.output?.flatMap((entry) => entry.content || []).find((entry) => entry.type === 'output_text')?.text; }

async function verifyFirebaseToken(token) {
  const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) });
  if (!verification.ok) throw new Error('Jeton Firebase invalide.');
}

export default async function handler(request, response) {
  response.setHeader('X-Ticket-Vision-Version', apiVersion);
  if (request.method !== 'POST') return response.status(405).json({ error: 'Méthode non autorisée.' });
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: 'Analyse Vision non configurée.', detectedVariables: Object.keys(process.env).filter((key) => key.includes('OPENAI')) });
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return response.status(401).json({ error: 'Connexion requise.' });
    await verifyFirebaseToken(token);
    const images = request.body?.images;
    if (!Array.isArray(images) || !images.length) return response.status(400).json({ error: 'Ajoute au moins une photo.' });
    if (images.length > 10) return response.status(400).json({ error: 'Maximum 10 photos par ticket.' });
    if (images.some((image) => typeof image !== 'string' || !image.startsWith('data:image/'))) return response.status(400).json({ error: 'Format d’image invalide.' });
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini', input: [{ role: 'user', content: [{ type: 'input_text', text: analysisInstructions }, ...images.map((image) => ({ type: 'input_image', image_url: image, detail: 'high' }))] }], text: { format: { type: 'json_schema', name: 'ticket_inventory', strict: true, schema } } }) });
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
