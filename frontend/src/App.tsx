import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import AdminBase from './components/layout/AdminBase';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import AdminLogin from './pages/login/AdminLogin';
import UserLogin from './pages/login/UserLogin';
import UserSignup from './pages/login/Signup';
import axios from 'axios';

const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/admin/check-auth', { withCredentials: true })
      .then(response => {
        setIsAuthenticated(response.data.isAuthenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/signup" element={<UserSignup />} />

            {/* Admin Routes */}
            <Route path="/login/AdminLogin" element={<AdminLogin />} />
            <Route
              path="/admin/*"
              element={
                isAuthenticated ? (
                  <AdminBase>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/products" element={<AdminProducts />} />
                      <Route path="/products/new" element={<ProductForm />} />
                      <Route path="/products/:id/edit" element={<ProductForm />} />
                    </Routes>
                  </AdminBase>
                ) : (
                  <Navigate to="/admin" />
                )
              }
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;