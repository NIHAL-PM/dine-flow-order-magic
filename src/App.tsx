
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { NotificationProvider } from './contexts/NotificationContext';
import Index from "./pages/Index";
import OrderTaking from "./pages/OrderTaking";
import KitchenDisplay from "./pages/KitchenDisplay";
import TableManagement from "./pages/TableManagement";
import MenuManagement from "./pages/MenuManagement";
import NotFound from "./pages/NotFound";
import NotificationWrapper from "./components/NotificationWrapper";
import Billing from "./pages/Billing";

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
          <Toaster />
          <NotificationWrapper />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/order-taking" element={<OrderTaking />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
