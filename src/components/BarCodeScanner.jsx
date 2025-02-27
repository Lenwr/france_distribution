/* eslint-disable */
import { useState, useEffect } from "react";

function BarCodeScanner() {const [barcode, setBarcode] = useState("");

    return (
        <div className="flex flex-col items-center p-4">
            <h2 className="text-lg font-bold mb-4">Scan a Barcode</h2>
            <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus // Permet de garder le focus sur l'input
                className="border p-2 rounded-md"
                placeholder="Scannez un code..."
            />
            {barcode && <p className="mt-4">Scanned Code: <strong>{barcode}</strong></p>}
        </div>
    );
}

export default BarCodeScanner;
