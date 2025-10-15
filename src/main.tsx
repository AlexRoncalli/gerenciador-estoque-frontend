import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';

import './index.css';

import { Layout } from './components/layout/layout.js';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Location } from './pages/Location';
import { Availability } from './pages/Availability';
import { Exit } from './pages/Exit';
import { PlaceholderPage } from './pages/_shared/PlaceholderPage';


//imports para autentificação de usuario
import App from './App.tsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom'; // <-- IMPORTE O BROWSER ROUTER
import { AuthProvider } from "./context/AuthContext.tsx"; // <-- IMPORTE O PROVIDER


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />,
        handle: { title: 'Home' },
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
        handle: { title: 'Dashboard' },
      },
      // ... outras rotas continuam iguais
      {
        path: '/estoque',
        element: <Inventory />, // Substitua o PlaceholderPage
        handle: { title: 'Gerenciar Estoque' }, // Atualize o título
      },
      {
        path: '/localizacao',
        element: <Location />,
        handle: { title: 'Localização' },
      },
      {
        path: '/disponibilidade',
        element: <PlaceholderPage name="Disponibilidade" />,
        handle: { title: 'Disponibilidade' },
      },
      {
        path: '/saida',
        element: <PlaceholderPage name="Saída de Produtos" />,
        handle: { title: 'Saída' },
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O BrowserRouter agora envolve tudo */}
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <App />
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
