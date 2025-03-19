/* eslint-disable */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNewArticle } from "../../redux/features/articlesSlice";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { fetchProduct } from "../../redux/services/articlesService";

const AddArticleForm = ({ resetState, setResetState }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.articles);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('');
    const [data, setData] = useState("");
    const [product, setProduct] = useState();
    const [notFound, setNotFound] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isBarcodeInputActive, setIsBarcodeInputActive] = useState(false);
    const [scanCode, setScanCode] = useState("");

    // Fetch du produit via OpenFoodFacts si un code-barres est scanné
    useEffect(() => {
        if (data) {
            handleFetchProduct(data);
        }
    }, [data]);

    const handleFetchProduct = async (ean) => {
        try {
            const productData = await fetchProduct(ean);
            if (productData) {
                setProduct(productData);
                setName(productData.product_name || "");
                setNotFound(false);
                console.log(product)
            } else {
                setProduct(null);
                setNotFound(true);
                setName("");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération :", error);
        }
    };

    // Ajout d'un article via Redux
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setMessage("Le nom de l'article ne peut pas être vide.");
            return;
        }
        if (!price || isNaN(price) || parseFloat(price) < 0) {
            setMessage("Veuillez entrer un prix valide.");
            setPrice("0");
            return;
        }

        const newArticle = {
            name,
            price: parseFloat(price),
            code_ref: data.replace(/\D/g, ""),
            suppliers: product?.brands,
        };

        dispatch(addNewArticle(newArticle)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                resetFields();
                setMessage("Article ajouté avec succès !");
            } else {
                setMessage("Erreur lors de l'ajout de l'article.");
            }
        });
    };

    const resetFields = () => {
        setName("");
        setPrice("");
        setData("");
        setProduct(null);
        setNotFound(false);
        setMessage("");
        setIsScanning(false)
    };

    return (
        <div className="container flex flex-col items-center p-6 bg-white">
            <h2 className="text-2xl text-black font-bold mb-4">Ajouter un article</h2>

            {/* Scanner */}
            <button onClick={() => setIsScanning(!isScanning)} className="btn bg-gray-600 text-white border-0 mb-2">
                {isScanning ? "Arrêter le scan" : "Ajouter par scan"}
            </button>

            {/* Scanner manuel */}
            <button onClick={() => setIsBarcodeInputActive(!isBarcodeInputActive)} className="btn bg-blue-600 text-white border-0">
                {isBarcodeInputActive ? "Arrêter le mode barcode" : "Utiliser barcode"}
            </button>

            {isScanning && (
                <div className="bg-white shadow-lg rounded-lg my-4">
                    <BarcodeScannerComponent
                        onUpdate={(err, result) => {
                            if (result) {
                                setData(result.text);
                            }
                        }}
                    />
                    <p className="mt-4 text-center text-black text-lg font-semibold">
                        Code scanné : <span className="text-blue-500">{data || "Aucun code détecté"}</span>
                    </p>
                </div>
            )}

            {/* Produit trouvé ou non trouvé */}
            {product ? (
                <div className="mt-6 p-4 bg-white shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl text-black font-bold">{product.product_name}</h3>
                    <p className="text-gray-700"><strong>Marque :</strong> {product.brands}</p>
                    <p className="text-gray-700"><strong>Catégorie :</strong> {product.categories}</p>
                </div>
            ) : notFound ? (
                <div className="mt-6 p-4 bg-red-100 shadow-lg rounded-lg w-80 text-center">
                    <h3 className="text-xl text-black font-bold">Produit non trouvé !</h3>
                    <p className="text-gray-700">Ajoutez un nom pour l'enregistrer.</p>
                </div>
            ) : null}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="w-full max-w-md mt-8">
                <div className="mb-4">
                    <label className="block text-gray-700">Nom de l'article</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nom de l'article"
                        className="w-full bg-white p-2 border rounded"
                        disabled={!notFound && !product}
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
                <button className="w-full bg-green-700 text-white p-2 rounded" type="submit" disabled={loading || !name || !price}>
                    {loading ? "Ajout en cours..." : "Ajouter"}
                </button>
            </form>

            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
};

export default AddArticleForm;
