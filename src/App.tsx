import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import Index from './pages/Index';
import Login from './pages/auth/Login';
import Dashboard from './pages/app/Dashboard';
import Results from './pages/app/Results';
import History from './pages/app/History';
import Profile from './pages/app/Profile';
import AdminResults from './pages/admin/Results';
import AdminUsers from './pages/admin/Users';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Pública */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Área do paciente */}
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
            <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Painel admin */}
            <Route path="/admin" element={<AdminRoute><AdminResults /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

            {/* Fallbacks */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
