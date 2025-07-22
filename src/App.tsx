import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import OrdensServico from './pages/OrdensServico';
import HistoricoMoto from './pages/HistoricoMoto';
import Automacoes from './pages/Automacoes';
import Configuracoes from './pages/Configuracoes';
import PortalCliente from './pages/PortalCliente';
import GestaoFinanceira from './pages/GestaoFinanceira';
import Estoque from './pages/Estoque';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/portal/:clienteId" 
            element={<PortalCliente />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/os" 
            element={
              <ProtectedRoute>
                <OrdensServico />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/historico/:clienteId/:motoId" 
            element={
              <ProtectedRoute>
                <HistoricoMoto />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/automacoes" 
            element={
              <ProtectedRoute>
                <Automacoes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/financeiro" 
            element={
              <ProtectedRoute>
                <GestaoFinanceira />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/estoque" 
            element={
              <ProtectedRoute>
                <Estoque />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuários</h1>
                  <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/configuracoes" 
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;