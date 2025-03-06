/* eslint-disable */
import { useState, useEffect } from "react";
import {supabase} from "../../hooks/useSupabase.js";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const AddArticleForm = ({ resetState, setResetState }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('');
    const [data, setData] = useState("");
    const [product, setProduct] = useState(null);
    const [notFound, setNotFound] = useState(false); // ✅ Produit introuvable
    const [isScanning, setIsScanning] = useState(false);
    const [isBarcodeInputActive, setIsBarcodeInputActive] = useState(false);
    const [scanCode, setScanCode] = useState("");


    useEffect(() => {
        if (data) {
            fetchProduct(data);
        }
    }, [data]);
    useEffect(() => {
        if (resetState) {
            resetFields();
            setResetState(false); // ✅ Réinitialiser resetState à false
        }
    }, [resetState, setResetState])

    const fetchProduct = async (ean) => {
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`);
            const result = await response.json();
            if (result.status === 1) {
                setProduct(result.product);
                setName(result.product.product_name || "");
                setNotFound(false); // ✅ Produit trouvé
            } else {
                setProduct(null);
                setNotFound(true); // 🚨 Produit introuvable
                setName(""); // On laisse l'utilisateur entrer un nom
            }
        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
        }
    };
    

    useEffect(() => {
        if (isBarcodeInputActive) {
            let buffer = "";

            const handleKeyDown = (event) => {
                if (event.key === "Enter") {
                    setData(buffer);
                    buffer = ""; // Reset buffer après scan
                } else {
                    buffer += event.key;
                }
            };

            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isBarcodeInputActive]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setMessage("Le nom de l'article ne peut pas être vide.");
            return;
        }
        if (!price || isNaN(price) || parseFloat(price) < 0) {
            setMessage("Veuillez entrer un prix valide supérieur ou égal à 0.");
            setPrice("0"); // ✅ Mettre à jour l'état avec "0"
            return;
        }

        try {
            const { data: insertedData, error } = await supabase.from("articles").insert([
                {
                    name,
                    price: parseFloat(price),
                    code_ref: data.replace(/\D/g, ""), // ✅ Code scanné dans code_ref
                    suppliers: product?.stores,
                    image_url: product?.image_url
                },
            ]);

            if (error) throw error;

            setName("");
            setPrice("");
            setData("");
            setProduct(null);
            setNotFound(false);
            setMessage("Article ajouté avec succès !");
        } catch (error) {
            setMessage(`Erreur : ${error.message}`);
        }
    };
    const resetFields = () => {
        setName("");
        setPrice("");
        setData("");
        setProduct(null);
        setNotFound(false);
        setMessage("");
    };

    return (
        <div className="container flex flex-col items-center p-6 bg-white">
            <h2 className="text-2xl text-black font-bold mb-4">Ajouter un article</h2>

            {/* Bouton pour scanner avec la caméra */}
            <button onClick={() => setIsScanning(!isScanning)} className="btn bg-gray-600 text-white border-0 mb-2">
                {isScanning ? "Arrêter le scan" : "Ajouter par scan"}
            </button>

            {/* Bouton pour utiliser un lecteur de code-barres manuel */}
            <button onClick={() => setIsBarcodeInputActive(!isBarcodeInputActive)} className="btn bg-blue-600 text-white border-0">
                {isBarcodeInputActive ? "Arrêter le mode barcode" : "Utiliser barcode"}
            </button>

            {isScanning && (
                <div className="bg-white shadow-lg rounded-lg my-4">
                    <BarcodeScannerComponent
                        onUpdate={(err, result) => {
                            if (result) {
                                 setData(result.text); // ✅ Garde uniquement les chiffres;
                            }
                        }}
                    />
                    <p className="mt-4 text-center text-black text-lg font-semibold">
                        Code scanné : <span className="text-blue-500">{data || "Aucun code détecté"}</span>
                    </p>
                </div>
            )}


            {product ? (
                // ✅ Affichage si le produit est trouvé
                <div className="mt-6 p-4 bg-white shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl text-black font-bold">{product.product_name}</h3>
                    <img className="w-32 h-32 mx-auto my-2 rounded-lg" src={product.image_url} alt={product.product_name} />
                    <p className="text-gray-700"><strong>Marque :</strong> {product.brands}</p>
                    <p className="text-gray-700"><strong>Catégorie :</strong> {product.stores}</p>
                </div>
            ) : notFound ? (
                // 🚨 Affichage si le produit n'est PAS trouvé
                <div className="mt-6 p-4 bg-red-100 shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl text-black font-bold">Produit non trouvé !</h3>
                    <h3 className="text-xl text-black font-bold">code ref : {data.replace(/\D/g, "")}</h3>
                    <p className="text-gray-700">Ajoutez un nom pour l'enregistrer.</p>
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="w-full max-w-md mt-8">
                <div className="mb-4">
                    <label className="block text-gray-700">Nom de l'article</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nom de l'article"
                        className="w-full bg-white p-2 border rounded"
                        disabled={!notFound && !product} // ✅ Désactivé si aucun produit scanné
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Prix</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Prix"
                        className="w-full bg-white p-2 border rounded"
                    />
                </div>
                <button className="w-full bg-green-700 text-white p-2 rounded" type="submit" disabled={!name || !price}>
                    Ajouter
                </button>
            </form>

            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
};

export default AddArticleForm;
