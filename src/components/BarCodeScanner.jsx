/* eslint-disable */
import { useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

function BarCodeScanner() {
    const [data, setData] = useState("");
    const [product, setProduct] = useState(null);

    useEffect(() => {
        if (data) {
            fetchProduct(data);
        }
    }, [data]);

    const fetchProduct = async (ean) => {
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`);
            const result = await response.json();
            if (result.status === 1) {
                setProduct(result.product);
                console.log(result.product);
            } else {
                setProduct(null);
                alert("Produit non trouvé !");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Scanner un code-barres</h2>
            <div className=" bg-white shadow-lg rounded-lg">
                <BarcodeScannerComponent
                    onUpdate={(err, result) => {
                        if (result) setData(result.text);
                    }}
                />
            </div>
            <p className="mt-4 text-lg font-semibold">Code scanné : <span className="text-blue-500">{data || "Aucun code détecté"}</span></p>

            {product && (
                <div className="mt-6 p-4 bg-white shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl font-bold">{product.product_name}</h3>
                    <img className="w-32 h-32 mx-auto my-2 rounded-lg" src={product.image_url}
                         alt={product.product_name}/>
                    <p className="text-gray-700"><strong>Marque :</strong> {product.brands}</p>
                    <p className="text-gray-700"><strong>Catégorie :</strong> {product.categories}</p>
                    <p className="text-gray-700"><strong>Fournisseur :</strong> {product.stores}</p>
                </div>
            )}
        </div>
    );
}

export default BarCodeScanner;
