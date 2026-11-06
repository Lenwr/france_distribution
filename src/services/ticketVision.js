import { firebaseAuth } from "./firebaseClient.js";

async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function analyzeTicketWithVision(files) {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return { items: [] };
  if (!firebaseAuth?.currentUser)
    throw new Error("Connexion requise pour analyser le ticket.");
  const result = await fetch("/api/analyze-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await firebaseAuth.currentUser.getIdToken()}`,
    },
    body: JSON.stringify({
      images: await Promise.all(imageFiles.map(prepareImage)),
    }),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok)
    throw new Error(payload.error || "Analyse Vision indisponible.");
  return {
    ...payload,
    items: (payload.items || []).map((item) => ({
      name: item.name || "",
      quantity: item.quantity || 1,
      purchase_price: item.unit_price_eur ?? "",
      promo_price: item.net_unit_price_eur ?? "",
      sale_price: "",
      discount_eur: item.discount_eur ?? "",
      initial_total_eur: item.line_total_eur ?? "",
      paid_total_eur: item.paid_total_eur ?? "",
      confidence: item.confidence || "medium",
      review_required: Boolean(item.review_required),
      source_text: item.source_text || "",
    })),
  };
}
