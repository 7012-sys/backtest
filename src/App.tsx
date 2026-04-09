import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";

// Lazy load all non-landing pages to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Demo = lazy(() => import("./pages/Demo"));
const StrategyBuilder = lazy(() => import("./pages/StrategyBuilder"));
const AIStrategyPage = lazy(() => import("./pages/AIStrategyPage"));
const BacktestRunner = lazy(() => import("./pages/BacktestRunner"));
const BacktestDetail = lazy(() => import("./pages/BacktestDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpgradeSuccess = lazy(() => import("./pages/UpgradeSuccess"));
const StrategyComparison = lazy(() => import("./pages/StrategyComparison"));
const Strategies = lazy(() => import("./pages/Strategies"));
const StrategyDetail = lazy(() => import("./pages/StrategyDetail"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Refund = lazy(() => import("./pages/legal/Refund"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CommunityStrategies = lazy(() => import("./pages/CommunityStrategies"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-foreground">Loading...</div>
  </div>
);

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/community-strategies" element={<CommunityStrategies />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund-policy" element={<Refund />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
