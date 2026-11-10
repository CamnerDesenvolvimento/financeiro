import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Loading } from '@/components/ui';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clientes from '@/pages/Clientes';
import ClienteDetalhe from '@/pages/ClienteDetalhe';
import Projetos from '@/pages/Projetos';
import ProjetoDetalhe from '@/pages/ProjetoDetalhe';
import Contratos from '@/pages/Contratos';
import ContratoDetalhe from '@/pages/ContratoDetalhe';
import Receber from '@/pages/Receber';
import Caixa from '@/pages/Caixa';
import Relatorios from '@/pages/Relatorios';
import Socios from '@/pages/Socios';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
});

function Protegido({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Protegido>
                  <Layout />
                </Protegido>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/:id" element={<ClienteDetalhe />} />
              <Route path="projetos" element={<Projetos />} />
              <Route path="projetos/:id" element={<ProjetoDetalhe />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="contratos/:id" element={<ContratoDetalhe />} />
              <Route path="receber" element={<Receber />} />
              <Route path="caixa" element={<Caixa />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="socios" element={<Socios />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
