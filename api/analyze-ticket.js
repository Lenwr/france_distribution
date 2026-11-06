/* global process */

const firebaseApiKey =
  process.env.FIREBASE_WEB_API_KEY || "AIzaSyALS0RP2ri_h5Z_H839hQYPl6LgQWSSFNk";
const apiVersion = "2026-11-06.2";

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "supplier",
    "date",
    "total_eur",
    "total_discount_eur",
    "receipt_item_count",
    "items",
  ],
  properties: {
    supplier: { type: "string" },
    date: { type: "string" },
    total_eur: { type: ["number", "null"] },
    total_discount_eur: { type: ["number", "null"] },
    receipt_item_count: { type: ["number", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "quantity",
          "unit_price_eur",
          "line_total_eur",
          "paid_total_eur",
          "discount_eur",
          "net_unit_price_eur",
          "source_section",
          "confidence",
          "source_text",
        ],
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit_price_eur: { type: ["number", "null"] },
          line_total_eur: { type: ["number", "null"] },
          paid_total_eur: { type: ["number", "null"] },
          discount_eur: { type: ["number", "null"] },
          net_unit_price_eur: { type: ["number", "null"] },
          source_section: {
            type: "string",
            enum: ["normal", "discounted", "unknown"],
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          source_text: { type: "string" },
        },
      },
    },
  },
};

const analysisInstructions = `Analyse toutes les photos comme les parties successives d'un seul ticket de caisse français.
Les photos d'un ticket long peuvent se chevaucher : déduplique uniquement les mêmes lignes physiques visibles sur deux photos successives. Ne confonds jamais ce chevauchement photographique avec deux achats similaires imprimés à des endroits différents du ticket.
Commence par lire fidèlement les blocs dans leur ordre d'impression. Extrais le magasin, la date au format YYYY-MM-DD, le total payé, le total des remises, le nombre d'articles imprimé et tous les produits réellement achetés.
La sortie items doit être un INVENTAIRE REGROUPÉ, pas une transcription ligne par ligne : une seule ligne finale par produit commercial regroupé, avec sa quantité totale, sa valeur initiale totale et son total réellement payé après promotions.
Une notation comme « 7*2,34 », « 7 x 2,34 € » ou « 7X2.34 » signifie quantité 7 et prix normal unitaire 2,34 €.
Quand un produit sans multiplicateur est suivi uniquement de son montant, utilise une quantité de 1.
Les titres de section donnent du contexte mais leur présentation varie selon le magasin. Une section de remises peut contenir des achats supplémentaires ou détailler des promotions : suis les lignes physiques et les calculs, sans supposer qu'il s'agit d'un récapitulatif.
Une ligne produit peut être immédiatement suivie d'une ligne de remise négative. Associe cette remise au produit précédent seulement lorsque le libellé, la proximité et les montants rendent cette association crédible. Une ligne négative, un avantage fidélité, « GDM », « SAVE », « REMISE », « CALENDRIERS », ou un autre libellé de réduction N'EST JAMAIS un produit séparé et ne doit jamais apparaître dans items.
Pour chaque produit regroupé :
- unit_price_eur = prix normal unitaire affiché après le multiplicateur ;
- line_total_eur = valeur totale au prix initial avant toutes les remises ;
- paid_total_eur = total réellement payé pour ce produit après toutes ses remises ;
- discount_eur = line_total_eur - paid_total_eur ;
- net_unit_price_eur = paid_total_eur / quantité.
Le montant situé à droite d'une ligne remisée peut déjà être le total net du lot : ne le prends pas pour un prix unitaire.
Regroupe toutes les occurrences du même produit, même si certaines sont gratuites ou ont une remise différente. Si un produit regroupé a plusieurs prix initiaux, unit_price_eur est la moyenne pondérée line_total_eur / quantité. Regroupe aussi des variantes d'une même famille lorsqu'une ligne de promotion montre clairement qu'elles participent au même avantage ; utilise alors un nom explicite comme « Produit (variante A + variante B) ».
Une remise égale au total normal donne un prix net de 0 € : le produit gratuit doit rester dans l'inventaire.
Pour chaque produit, recopie dans source_text le texte brut utile visible sur le ticket. Indique confidence=high si nom, quantité et prix sont nets et cohérents, medium si une interprétation mineure est nécessaire, low si l'association d'une remise, la quantité ou le prix est ambiguë. Utilise source_section=discounted uniquement si le produit est clairement dans une zone promotionnelle.
Utilise le total des remises, le total payé et le nombre total d'articles imprimés en bas du ticket comme contrôles de cohérence, sans les ajouter comme produits. Ne modifie jamais une valeur lisible uniquement pour forcer l'égalité des totaux.
Ignore les titres de rayon, TVA, moyens de paiement, fidélité, codes-barres et lignes administratives.
N'invente rien : utilise null ou une chaîne vide si une valeur est illisible ou incertaine.`;

const numberOrNull = (value) =>
  value === null || value === undefined || value === ""
    ? null
    : Number.isFinite(Number(value))
    ? Number(value)
    : null;
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
export function normalizeAnalysis(analysis) {
  const items = (analysis.items || []).map((item) => {
    const quantity = Math.max(1, numberOrNull(item.quantity) || 1);
    const unitPrice = numberOrNull(item.unit_price_eur);
    const providedPaidTotal = numberOrNull(item.paid_total_eur);
    const providedDiscount = numberOrNull(item.discount_eur);
    const grossTotal =
      unitPrice === null
        ? numberOrNull(item.line_total_eur)
        : roundMoney(quantity * unitPrice);
    const paidTotal =
      providedPaidTotal !== null
        ? roundMoney(Math.max(0, providedPaidTotal))
        : grossTotal !== null && providedDiscount !== null
        ? roundMoney(Math.max(0, grossTotal - providedDiscount))
        : grossTotal;
    const discount =
      grossTotal !== null && paidTotal !== null
        ? roundMoney(Math.max(0, grossTotal - paidTotal))
        : providedDiscount;
    const calculatedNet =
      paidTotal !== null &&
      grossTotal !== null &&
      Math.abs(paidTotal - grossTotal) >= 0.01
        ? roundMoney(paidTotal / quantity)
        : null;
    const providedNet = numberOrNull(item.net_unit_price_eur);
    const netUnitPrice =
      calculatedNet ??
      (providedNet !== null &&
      unitPrice !== null &&
      Math.abs(providedNet - unitPrice) >= 0.01
        ? roundMoney(providedNet)
        : null);
    const confidence = ["high", "medium", "low"].includes(item.confidence)
      ? item.confidence
      : "medium";
    return {
      ...item,
      quantity,
      unit_price_eur: unitPrice,
      line_total_eur: grossTotal,
      paid_total_eur: paidTotal,
      discount_eur: discount,
      net_unit_price_eur: netUnitPrice,
      confidence,
      review_required:
        confidence === "low" ||
        !String(item.name || "").trim() ||
        unitPrice === null,
    };
  });
  const calculable = items.filter((item) => item.paid_total_eur !== null);
  const computedTotal = calculable.length
    ? roundMoney(calculable.reduce((sum, item) => sum + item.paid_total_eur, 0))
    : null;
  const computedCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const receiptTotal = numberOrNull(analysis.total_eur);
  const receiptCount = numberOrNull(analysis.receipt_item_count);
  const totalDifference =
    receiptTotal !== null && computedTotal !== null
      ? roundMoney(receiptTotal - computedTotal)
      : null;
  const countDifference =
    receiptCount !== null ? receiptCount - computedCount : null;
  const warnings = [];
  if (totalDifference !== null && Math.abs(totalDifference) > 0.05)
    warnings.push(`Écart de total : ${Math.abs(totalDifference).toFixed(2)} €`);
  if (countDifference !== null && countDifference !== 0)
    warnings.push(`Écart d’articles : ${Math.abs(countDifference)}`);
  const reviewCount = items.filter((item) => item.review_required).length;
  if (reviewCount) warnings.push(`${reviewCount} ligne(s) à vérifier`);
  return {
    ...analysis,
    items,
    validation: {
      status: warnings.length ? "warning" : "ok",
      warnings,
      receipt_total_eur: receiptTotal,
      computed_total_eur: computedTotal,
      total_difference_eur: totalDifference,
      receipt_item_count: receiptCount,
      computed_item_count: computedCount,
      item_count_difference: countDifference,
      review_required_count: reviewCount,
    },
  };
}

function outputText(payload) {
  return (
    payload.output_text ||
    payload.output
      ?.flatMap((entry) => entry.content || [])
      .find((entry) => entry.type === "output_text")?.text
  );
}

async function verifyFirebaseToken(token) {
  const verification = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!verification.ok) throw new Error("Jeton Firebase invalide.");
}

export default async function handler(request, response) {
  response.setHeader("X-Ticket-Vision-Version", apiVersion);
  if (request.method !== "POST")
    return response.status(405).json({ error: "Méthode non autorisée." });
  if (!process.env.OPENAI_API_KEY)
    return response.status(503).json({
      error: "Analyse Vision non configurée.",
      detectedVariables: Object.keys(process.env).filter((key) =>
        key.includes("OPENAI")
      ),
    });
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token)
      return response.status(401).json({ error: "Connexion requise." });
    await verifyFirebaseToken(token);
    const images = request.body?.images;
    if (!Array.isArray(images) || !images.length)
      return response.status(400).json({ error: "Ajoute au moins une photo." });
    if (images.length > 10)
      return response
        .status(400)
        .json({ error: "Maximum 10 photos par ticket." });
    if (
      images.some(
        (image) => typeof image !== "string" || !image.startsWith("data:image/")
      )
    )
      return response.status(400).json({ error: "Format d’image invalide." });
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: analysisInstructions },
              ...images.map((image) => ({
                type: "input_image",
                image_url: image,
                detail: "high",
              })),
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ticket_inventory",
            strict: true,
            schema,
          },
        },
      }),
    });
    const payload = await openaiResponse.json();
    if (!openaiResponse.ok)
      return response.status(openaiResponse.status).json({
        error: payload.error?.message || "Analyse Vision impossible.",
      });
    const text = outputText(payload);
    if (!text) throw new Error("Réponse Vision vide.");
    return response.status(200).json(normalizeAnalysis(JSON.parse(text)));
  } catch (error) {
    console.error("Ticket vision error:", error.message);
    return response
      .status(500)
      .json({ error: "Impossible d’analyser ce ticket." });
  }
}
