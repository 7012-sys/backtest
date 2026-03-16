import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Demo from "./pages/Demo";
import StrategyBuilder from "./pages/StrategyBuilder";
import AIStrategyPage from "./pages/AIStrategyPage";
import BacktestRunner from "./pages/BacktestRunner";
import BacktestDetail from "./pages/BacktestDetail";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Upgrade from "./pages/Upgrade";
import ResetPassword from "./pages/ResetPassword";
import UpgradeSuccess from "./pages/UpgradeSuccess";

import StrategyComparison from "./pages/StrategyComparison";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Refund from "./pages/legal/Refund";
import Disclaimer from "./pages/legal/Disclaimer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/strategy-builder" element={<StrategyBuilder />} />
            <Route path="/strategy/:id" element={<StrategyDetail />} />
            <Route path="/ai-strategy" element={<AIStrategyPage />} />
            <Route path="/backtest" element={<BacktestRunner />} />
            <Route path="/backtest/:id" element={<BacktestDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/upgrade/success" element={<UpgradeSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/compare-strategies" element={<StrategyComparison />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<Refund />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
