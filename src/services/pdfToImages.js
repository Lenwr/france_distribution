import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { firebaseAuth } from "./firebaseClient.js";

GlobalWorkerOptions.workerSrc = workerUrl;

const canvasToFile = (canvas, name) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], name, { type: "image/jpeg" }))
          : reject(new Error("Impossible de convertir une page du PDF.")),
      "image/jpeg",
      0.9
    );
  });

export async function pdfUrlToImageFiles(url) {
  if (!firebaseAuth?.currentUser)
    throw new Error("Connexion requise pour relire le PDF.");
  const response = await fetch(
    `/api/ticket-pdf?url=${encodeURIComponent(url)}`,
    {
      headers: {
        Authorization: `Bearer ${await firebaseAuth.currentUser.getIdToken()}`,
      },
    }
  );
  if (!response.ok) throw new Error("Le PDF archivé est introuvable.");
  const pdfDocument = await getDocument({ data: await response.arrayBuffer() })
    .promise;
  if (pdfDocument.numPages > 10)
    throw new Error("Ce PDF dépasse la limite de 10 pages par analyse.");
  const files = [];
  for (
    let pageNumber = 1;
    pageNumber <= pdfDocument.numPages;
    pageNumber += 1
  ) {
    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2.5, 1800 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;
    files.push(await canvasToFile(canvas, `ticket-page-${pageNumber}.jpg`));
    page.cleanup();
  }
  await pdfDocument.destroy();
  return files;
}
