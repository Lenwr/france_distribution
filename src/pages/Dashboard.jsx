/* eslint-disable */
import ProductsList from "./products/ProductsList.jsx";
import caisse from "../assets/caisse.svg";
import Barcode from "../assets/Barcode.svg";
import dashboard from "../assets/dashboard.svg";
import { useState } from "react";
import Sales from "./sales/sales.jsx";
import NavBar from "../components/navBar.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import Footer from "../components/Footer.jsx";
import BarCodeScanner from "../components/BarCodeScanner.jsx"; // ✅ Import du scanner

function Dashboard() {
    const [choice, setChoice] = useState("dashboard");
    const { user, profile } = useAuth(); // ✅ Correction des imports

    return (
        <div>
            <NavBar />
            <div className="dashboard flex flex-col md:flex-row bg-white">
                {/* Sidebar */}
                <div className="sideBar md:w-[20%] flex flex-col shadow-lg p-4">
                    <h1 className="text-black text-center text-2xl m-2 p-3 rounded shadow-lg bg-cyan-50 bg-opacity-30">
                        {profile?.username || "Utilisateur"}
                    </h1>

                    <div className="flex flex-col">
                        <img src={dashboard} alt="dashboard" className="mb-2" />
                        <button
                            onClick={() => setChoice("dashboard")}
                            className={`btn text-white text-2xl mx-2 p-3 border-0 ${
                                choice === "dashboard" ? "bg-gray-800" : "bg-gray-600"
                            }`}
                        >
                            Dashboard
                        </button>
                    </div>

                    <div className="flex flex-col mt-4">
                        <img src={caisse} alt="caisse" className="mb-2" />
                        <button
                            onClick={() => setChoice("caisse")}
                            className={`btn text-white text-2xl mx-2 p-3 border-0 ${
                                choice === "caisse" ? "bg-gray-800" : "bg-gray-600"
                            }`}
                        >
                            Caisse
                        </button>
                    </div>

                    <div className="flex flex-col mt-4">
                        <img src={Barcode} alt="scanner" className="mb-2" />
                        <button
                            onClick={() => setChoice("Scan")}
                            className={`btn text-white text-2xl mx-2 p-3 border-0 ${
                                choice === "Scan" ? "bg-gray-800" : "bg-gray-600"
                            }`}
                        >
                            Scan
                        </button>
                    </div>
                </div>

                {/* Contenu Principal */}
                <div className="md:w-[80%] p-8 bg-cyan-50 bg-opacity-30">
                    {choice === "dashboard" ? (
                        <ProductsList />
                    ) : choice === "caisse" ? (
                        <Sales />
                    ) : (
                        <BarCodeScanner />
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Dashboard;
