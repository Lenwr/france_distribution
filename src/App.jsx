/* eslint-disable */
import './App.css'
import {
    BrowserRouter as Router, Route, Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import ProductsList from "./pages/products/ProductsList.jsx";
import ProductDetails from "./pages/products/productDetails.jsx";
import Orders from "./pages/orders/Orders.jsx";
import BarCodeScanner from "./components/BarCodeScanner.jsx";
import OrderHistory from "./pages/orders/orderHistory.jsx";
import Sales from "./pages/sales/sales.jsx";
import Account from "./pages/profile/Account.jsx";
import Login from "./auth/Login.jsx";
import AuthRoute from "./routes/AuthRoute.jsx";
import {Home} from "lucide-react";
import AuthProvider from "./auth/AuthProvider.jsx";
import NavBar from "./components/navBar.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";


function App() {
  return (
      <>
      <AuthProvider>
          <Router>
          <Routes>
              {/* Route protégée */}
              <Route path="/" element={
                  <AdminRoute>
                      <Dashboard />
                  </AdminRoute>
              } />
              <Route path="/sales" element={
               <AuthRoute>
               <Sales/>
               </AuthRoute>
              }/>
              <Route path="/profile" element={<Account/> }/>
              <Route path="/login" element={<Login/> }/>
          </Routes>
          </Router>
              </AuthProvider>
      </>
  );
}
export default App




