import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "./components/AuthGuard.tsx";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";
import LegalPlaceholder from "./pages/LegalPlaceholder.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import { PRODUCT_MAP_BG } from "@/components/product-map/constants";

const AdminProductMap = lazy(() => import("./pages/AdminProductMap"));

const queryClient = new QueryClient();

function MapLoadingFallback() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
      style={{ backgroundColor: PRODUCT_MAP_BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Loader2 className="h-10 w-10 animate-spin text-[#C6017F]" aria-hidden />
      <p className="text-sm font-medium text-[#2E2D2C]">Cargando mapa de producto...</p>
      <div className="flex w-full max-w-md flex-col gap-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-[#E5E5E5]" />
        <div className="h-24 w-full animate-pulse rounded-2xl border border-[#F2F2F2] bg-white/60" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 animate-pulse rounded-xl bg-[#FFF0F9]/80" />
          <div className="h-8 flex-1 animate-pulse rounded-xl bg-[#E5E5E5]/60" />
          <div className="h-8 flex-1 animate-pulse rounded-xl bg-[#E5E5E5]/60" />
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<LegalPlaceholder title="Términos" />} />
        <Route path="/privacy" element={<LegalPlaceholder title="Privacidad" />} />
        <Route
          path="/onboarding"
          element={
            <AuthGuard>
              <Onboarding />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/mapa"
          element={
            <Suspense fallback={<MapLoadingFallback />}>
              <AdminProductMap mode="public" />
            </Suspense>
          }
        />
        <Route
          path="/admin/mapa"
          element={
            <AuthGuard>
              <Suspense fallback={<MapLoadingFallback />}>
                <AdminProductMap mode="admin" />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
