import { localMode } from './services/appMode.js';
import './App.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthRoute from './routes/AuthRoute';
import AdminRoute from './routes/AdminRoute';
import AppShell from './components/AppShell';
import { refreshExchangeRate } from './services/currency.js';
const Scanner = lazy(() => import('./components/BarCodeScanner'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sales = lazy(() => import('./pages/sales/sales'));
const Orders = lazy(() => import('./pages/orders/Orders'));
const Catalogue = lazy(() => import('./pages/catalogue/Catalogue'));
const ProductDetailPage = lazy(() => import('./pages/catalogue/ProductDetailPage'));
const PublicCatalogue = lazy(() => import('./pages/public/PublicCatalogue'));
const SalesStats = lazy(() => import('./pages/stats/SalesStats'));
const Account = lazy(() => import('./pages/profile/Account'));
const Login = lazy(() => import('./auth/Login'));
const NotFound = lazy(() => import('./components/notFound'));
export default function App() {
  const [, setCurrencyVersion] = useState(0);
  useEffect(() => { const update = () => setCurrencyVersion((version) => version + 1); window.addEventListener('currency-rate-updated', update); refreshExchangeRate(); return () => window.removeEventListener('currency-rate-updated', update); }, []);
  return <BrowserRouter><Suspense fallback={<p role="status" className="p-8">Chargement…</p>}><Routes>
    <Route path="/catalogue-public" element={<PublicCatalogue />} />
    <Route path="/" element={<AdminRoute><AppShell><Dashboard /></AppShell></AdminRoute>} />
    <Route path="/sales" element={<AdminRoute><AppShell><Sales /></AppShell></AdminRoute>} />
    <Route path="/stats" element={<AdminRoute><AppShell><SalesStats /></AppShell></AdminRoute>} />
    <Route path="/orders" element={<AdminRoute><AppShell><Orders /></AppShell></AdminRoute>} />
    <Route path="/catalogue" element={<AdminRoute><AppShell><Catalogue /></AppShell></AdminRoute>} />
    <Route path="/catalogue/:id" element={<AdminRoute><AppShell><ProductDetailPage /></AppShell></AdminRoute>} />
    <Route path="/products" element={<Navigate to="/catalogue" replace />} />
    <Route path="/profile" element={localMode ? <Navigate to="/" replace /> : <AuthRoute><AppShell><Account /></AppShell></AuthRoute>} />
    <Route path="/scan" element={<AdminRoute><AppShell><Scanner /></AppShell></AdminRoute>} />
    <Route path="/login" element={localMode ? <Navigate to="/" replace /> : <Login />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></BrowserRouter>;
}
