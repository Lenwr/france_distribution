/* eslint-disable */
import { useState, useEffect } from "react";
import supabase from "../../hooks/useSupabase.js";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const AddArticleForm = () => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('');
    const [data, setData] = useState("");
    const [product, setProduct] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

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
                setName(result.product.product_name || "");
                console.log(result.product.id);
            } else {
                setProduct(null);
                alert("Produit non trouvé !");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setMessage("Le nom de l'article ne peut pas être vide.");
            return;
        }
        if (!price || isNaN(price) || parseFloat(price) <= 0) {
            setMessage("Veuillez entrer un prix valide supérieur à 0.");
            return;
        }

        try {
            const { data, error } = await supabase.from("articles").insert([
                { name, price: parseFloat(price), code_ref: product?.id, suppliers: product?.stores , image_url: product?.image_url },
            ]);

            if (error) throw error;

            setName("");
            setPrice("");
            setData("");
            setProduct(null);
            setMessage("Article ajouté avec succès !");
        } catch (error) {
            setMessage(`Erreur : ${error.message}`);
        }
    };

    return (
        <div className="container flex flex-col items-center p-6 bg-white ">
            <h2 className="text-2xl text-black font-bold mb-4">Ajouter un article</h2>
            <button onClick={() => setIsScanning(!isScanning)} className=" btn bg-gray-600 text-white border-0">
                {isScanning ? "Arrêter le scan" : "Ajouter par scan"}
            </button>
            {isScanning && (
                <div className="bg-white shadow-lg rounded-lg my-4">
                    <BarcodeScannerComponent
                        onUpdate={(err, result) => {
                            if (result) setData(result.text);
                        }}
                    />
                    <p className="mt-4  text-center text-black text-lg font-semibold">Code scanné : <span
                        className="text-blue-500">{data || "Aucun code détecté"}</span></p>

                </div>
            )}
            {product && (
                <div className="mt-6 p-4 bg-white shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl text-black font-bold">{product.product_name}</h3>
                    <img className="w-32 h-32 mx-auto my-2 rounded-lg" src={product.image_url} alt={product.product_name} />
                    <p className="text-gray-700"><strong>Marque :</strong> {product.brands}</p>
                    <p className="text-gray-700"><strong>Catégorie :</strong> {product.stores}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="w-full max-w-md mt-8">
                <div className="mb-4">
                    <label className="block text-gray-700">Nom de l'article</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'article" className="w-full bg-white p-2 border rounded" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Prix</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prix" className="w-full bg-white p-2 border rounded" />
                </div>
                <button className="w-full bg-green-700 text-white p-2 rounded" type="submit">Ajouter</button>
            </form>
            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
};

export default AddArticleForm;
