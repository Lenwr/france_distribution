/* eslint-disable */

import ProductsList from "./products/ProductsList.jsx";
import caisse from "../assets/caisse.svg"
import Barcode from "../assets/Barcode.svg"
import dashboard from "../assets/dashboard.svg"
import {useEffect, useState} from "react";
import Sales from "./sales/sales.jsx";
import NavBar from "../components/navBar.jsx";
import {useAuth} from "../auth/AuthProvider.jsx";
import {supabase} from "../hooks/useSupabase.js";
import Footer from "../components/Footer.jsx";

function Dashboard() {
    const [choice, setChoice] = useState('dashboard');
    const {user} = useAuth();
    const {profile, loading} = useAuth();

   const changeColor = () => {
    
    }



    return (
        <div>
            <NavBar/>
            <div className="dashboard flex flex-col md:flex-row bg-white">
                <div className="sideBar md:w-[20%] flex flex-col shadow-lg">
                    <h1
                        className=" text-black text-center text-2xl m-2 p-3 rounded shadow-lg bg-cyan-50 bg-opacity-30">
                        {profile?.username}
                    </h1>
                    <div className="flex flex-col ">
                        <img src={dashboard} alt="caisse" className=""/>
                        <button onClick={() => {
                            setChoice('dashboard');
                        }} className="btn text-white text-2xl mx-2 p-3 border-0 bg-gray-600">
                            Dashboard
                        </button>
                    </div>
                    <div className="flex flex-col ">
                        <img src={caisse} alt="caisse" className=""/>
                        <button onClick={() => {
                            setChoice('caisse');
                        }} className="btn text-white text-2xl mx-2 p-3 border-0 bg-gray-600">Caisse
                        </button>

                    </div>
                    <div className="flex flex-col hidden ">
                        <img src={Barcode} alt="caisse" className=""/>
                        <button onClick={() => {
                            setChoice('Scan');
                        }} className="btn text-white text-2xl m-2 p-3 border-0 bg-gray-600">
                            Scan
                        </button>
                        <button ></button>
                    </div>
                </div>
                <div className=" md:w-[80%] p-8 bg-cyan-50 bg-opacity-30 ">

                    {
                        choice === 'dashboard' ?
                            <ProductsList/> :
                            choice === 'caisse' ?
                                <Sales/> : "scan"
                    }
                </div>
            </div>
            <Footer />
        </div>
    );
}


export default Dashboard;

