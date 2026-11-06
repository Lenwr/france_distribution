/* global Buffer, process */

const firebaseApiKey =
  process.env.FIREBASE_WEB_API_KEY || "AIzaSyALS0RP2ri_h5Z_H839hQYPl6LgQWSSFNk";
const storageBucket = "france-distribution-bcfee.firebasestorage.app";

async function verifyFirebaseToken(token) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!response.ok) throw new Error("Jeton Firebase invalide.");
  const payload = await response.json();
  return payload.users?.[0]?.localId;
}

function validateStorageUrl(rawUrl, userId) {
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "firebasestorage.googleapis.com"
  )
    throw new Error("Adresse de fichier invalide.");
  const prefix = `/v0/b/${storageBucket}/o/`;
  if (!url.pathname.startsWith(prefix))
    throw new Error("Bucket Firebase invalide.");
  const objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
  if (
    !objectPath.startsWith(`tickets/${userId}/`) ||
    !objectPath.endsWith(".pdf")
  )
    throw new Error("Accès interdit à ce fichier.");
  return url;
}

export default async function handler(request, response) {
  if (request.method !== "GET")
    return response.status(405).json({ error: "Méthode non autorisée." });
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token)
      return response.status(401).json({ error: "Connexion requise." });
    const userId = await verifyFirebaseToken(token);
    if (!userId)
      return response.status(401).json({ error: "Utilisateur invalide." });
    const fileUrl = validateStorageUrl(request.query.url, userId);
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok)
      return response.status(404).json({ error: "PDF introuvable." });
    const contentLength = Number(
      fileResponse.headers.get("content-length") || 0
    );
    if (contentLength > 15 * 1024 * 1024)
      return response.status(413).json({ error: "PDF trop volumineux." });
    const file = Buffer.from(await fileResponse.arrayBuffer());
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Cache-Control", "private, max-age=60");
    return response.status(200).send(file);
  } catch (error) {
    console.error("Ticket PDF proxy error:", error.message);
    return response
      .status(400)
      .json({ error: error.message || "Téléchargement impossible." });
  }
}
