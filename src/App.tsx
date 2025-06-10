
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderTaking from "./pages/OrderTaking";
import KitchenDisplay from "./pages/KitchenDisplay";
import TableManagement from "./pages/TableManagement";
import MenuManagement from "./pages/MenuManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/order-taking" element={<OrderTaking />} />
          <Route path="/kitchen" element={<KitchenDisplay />} />
          <Route path="/tables" element={<TableManagement />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
