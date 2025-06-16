
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { OrderProvider } from "./contexts/OrderContext";
import { TableProvider } from "./contexts/TableContext";
import { MenuProvider } from "./contexts/MenuContext";
import { CustomerProvider } from "./contexts/CustomerContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import OfflineIndicator from "./components/OfflineIndicator";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderTaking from "./pages/OrderTaking";
import KitchenDisplay from "./pages/KitchenDisplay";
import TableManagement from "./pages/TableManagement";
import MenuManagement from "./pages/MenuManagement";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DatabaseProvider>
        <SettingsProvider>
          <NotificationProvider>
            <CustomerProvider>
              <InventoryProvider>
                <MenuProvider>
                  <TableProvider>
                    <OrderProvider>
                      <div className="min-h-screen w-full">
                        <Toaster />
                        <Sonner />
                        <OfflineIndicator />
                        <BrowserRouter>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/order-taking" element={<OrderTaking />} />
                            <Route path="/billing" element={<Billing />} />
                            <Route path="/kitchen" element={<KitchenDisplay />} />
                            <Route path="/tables" element={<TableManagement />} />
                            <Route path="/menu" element={<MenuManagement />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </BrowserRouter>
                      </div>
                    </OrderProvider>
                  </TableProvider>
                </MenuProvider>
              </InventoryProvider>
            </CustomerProvider>
          </NotificationProvider>
        </SettingsProvider>
      </DatabaseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
