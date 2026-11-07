import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { ScanText } from "lucide-react";
import { doc, getDoc } from "../../services/dataStore.js";
import { firestore } from "../../hooks/useSupabase.js";
import { analyzeTicketImages } from "../../services/ticketOcr.js";
import { analyzeTicketWithVision } from "../../services/ticketVision.js";
import { pdfUrlToImageFiles } from "../../services/pdfToImages.js";
import { updatePurchaseInventory } from "../../services/purchasesService.js";
const blank = () => ({
  name: "",
  quantity: 1,
  purchase_price: "",
  promo_price: "",
  sale_price: "",
});
const emptyLines = [];
export default function InventoryDraft({
  purchaseId,
  initialLines = emptyLines,
}) {
  const key = `purchase-inventory:${purchaseId}`;
  const [lines, setLines] = useState([blank()]);
  const [validation, setValidation] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setLines(JSON.parse(saved));
    else if (initialLines.length) setLines(initialLines);
    getDoc(doc(firestore, "achats", purchaseId))
      .then((snapshot) => {
        const data = snapshot.data();
        if (!saved && !initialLines.length)
          setLines(data?.inventory?.length ? data.inventory : [blank()]);
        setValidation(data?.analysis_validation || null);
        setPdfUrl(data?.file_url || data?.file_data || "");
      })
      .catch(() => setLines([blank()]));
  }, [key, purchaseId, initialLines]);
  const update = (index, field, value) =>
    setLines((current) =>
      current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  async function save() {
    try {
      localStorage.setItem(key, JSON.stringify(lines));
      await updatePurchaseInventory(purchaseId, lines, validation);
      toast.success("Inventaire sauvegardé sans modifier le stock.");
    } catch (error) {
      toast.error(error.message || "Sauvegarde impossible.");
    }
  }
  async function reanalyze(files) {
    if (!files.length) return;
    setAnalyzing(true);
    const pending = toast.loading("Réanalyse du ticket…");
    try {
      let detected;
      let nextValidation = null;
      try {
        const analysis = await analyzeTicketWithVision(files);
        detected = analysis.items;
        nextValidation = analysis.validation || null;
      } catch {
        toast.info("Vision indisponible : analyse OCR locale en cours…");
        detected = await analyzeTicketImages(files);
      }
      if (!detected.length)
        throw new Error(
          "Aucune ligne reconnue. Prends une photo plus nette, avec tout le texte visible."
        );
      setLines(detected);
      setValidation(nextValidation);
      localStorage.setItem(key, JSON.stringify(detected));
      await updatePurchaseInventory(purchaseId, detected, nextValidation);
      toast.update(pending, {
        render: `${detected.length} ligne(s) détectée(s).`,
        type: "success",
        isLoading: false,
        autoClose: 3500,
      });
    } catch (error) {
      toast.update(pending, {
        render: error.message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setAnalyzing(false);
    }
  }
  async function reanalyzeSavedPdf() {
    if (!pdfUrl) {
      toast.warning(
        "PDF archivé indisponible. Sélectionne les photos du ticket."
      );
      return;
    }
    const pending = toast.loading("Lecture du PDF archivé…");
    try {
      const files = await pdfUrlToImageFiles(pdfUrl);
      toast.dismiss(pending);
      await reanalyze(files);
    } catch (error) {
      toast.dismiss(pending);
      toast.error(error.message || "Impossible de relire le PDF archivé.");
    }
  }
  return (
    <section className="stats-panel inventory-draft">
      <div className="panel-heading">
        <h2>Inventaire du ticket</h2>
        <span>Vérifie les informations détectées</span>
      </div>
      <div className="inventory-reanalyze">
        <button
          className="btn"
          type="button"
          disabled={analyzing}
          onClick={reanalyzeSavedPdf}
        >
          <ScanText size={16} />{" "}
          {analyzing ? "Analyse en cours…" : "Réanalyser le PDF archivé"}
        </button>
        <label className="btn btn-sm">
          Utiliser des photos à la place
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            disabled={analyzing}
            onChange={(event) =>
              reanalyze(Array.from(event.target.files || []))
            }
          />
        </label>
        <small>
          Le PDF sauvegardé est utilisé automatiquement. Les photos servent
          uniquement de secours.
        </small>
      </div>
      {validation && (
        <div
          className={`inventory-validation inventory-validation-${validation.status}`}
        >
          <strong>
            {validation.status === "ok"
              ? "Ticket cohérent"
              : "Vérification nécessaire"}
          </strong>
          <span>
            Total ticket : {validation.receipt_total_eur ?? "—"} € · Total
            détecté : {validation.computed_total_eur ?? "—"} €
            {validation.receipt_item_count !== null &&
            validation.receipt_item_count !== undefined
              ? ` · Articles ticket : ${validation.receipt_item_count} · Détectés : ${validation.computed_item_count}`
              : ""}
          </span>
          {validation.warnings?.length > 0 && (
            <small>{validation.warnings.join(" · ")}</small>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix normal unitaire</th>
              <th>Prix net promo</th>
              <th>Prix de vente</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                className={line.review_required ? "inventory-row-review" : ""}
                key={index}
              >
                <td>
                  <input
                    className="input"
                    value={line.name || ""}
                    onChange={(event) =>
                      update(index, "name", event.target.value)
                    }
                  />
                  {line.confidence && line.confidence !== "high" && (
                    <span
                      className={`confidence-badge confidence-${line.confidence}`}
                    >
                      {line.confidence === "low"
                        ? "À vérifier"
                        : "Lecture moyenne"}
                    </span>
                  )}
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) =>
                      update(index, "quantity", event.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.purchase_price}
                    onChange={(event) =>
                      update(index, "purchase_price", event.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.promo_price}
                    onChange={(event) =>
                      update(index, "promo_price", event.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.sale_price}
                    onChange={(event) =>
                      update(index, "sale_price", event.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sale-actions">
        <button
          className="btn"
          type="button"
          onClick={() => setLines((current) => [...current, blank()])}
        >
          Ajouter une ligne
        </button>
        <button className="btn btn-primary" type="button" onClick={save}>
          Sauvegarder l’inventaire
        </button>
      </div>
    </section>
  );
}
InventoryDraft.propTypes = {
  purchaseId: PropTypes.string.isRequired,
  initialLines: PropTypes.arrayOf(PropTypes.object),
};
