// eslint-disable-next-line no-undef
import './App.css'
import {
    BrowserRouter as Router, Route, Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import ProductsList from "./pages/products/ProductsList.jsx";
import ProductDetails from "./pages/products/productDetails.jsx";
import Orders from "./pages/orders/Orders.jsx";
import BarCodeScanner from "./components/BarCodeScanner.jsx";


function App() {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produits" element={<ProductsList />} />
              <Route path="/commandes" element={<Orders />} />
              <Route path="/produits/:id" element={<ProductDetails />} />
              <Route path="/barCode" element={<BarCodeScanner/>} />
          </Routes>
      </Router>
  );
}

export default App




