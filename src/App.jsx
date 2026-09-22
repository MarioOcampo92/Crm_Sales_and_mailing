import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import ImportPage from './pages/ImportPage';
import DirectorioPage from './pages/DirectorioPage';
import MailingPage from './pages/MailingPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalLayout from './components/portal/PortalLayout';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// ─── Portal de Clientes ───────────────────────────────────────
function PortalRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Sin sesión → login del portal
  if (!session) return <PortalLoginPage />;

  // Con sesión → portal del cliente
  return (
    <PortalLayout>
      <Routes>
        <Route path="/" element={<PortalDashboardPage />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </PortalLayout>
  );
}

// ─── CRM Interno (Admin) ──────────────────────────────────────
function AdminRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Sin sesión → login del CRM
  if (!session) return <LoginPage />;

  // Si es un cliente (logueado con Magic Link), redirigir al portal
  const userRole = session?.user?.user_metadata?.role;
  if (userRole === 'client') {
    return <Navigate to="/portal" replace />;
  }

  // Con sesión admin → app completa
  return (
    <Layout>
      <Routes>
        <Route path="/"        element={<DashboardPage />} />
        <Route path="/kanban"  element={<KanbanPage />} />
        <Route path="/leads"   element={<DirectorioPage />} />
        <Route path="/mailing" element={<MailingPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/import"  element={<ImportPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// ─── Router Principal ─────────────────────────────────────────
function AppRouter() {
  const location = useLocation();
  const isPortalRoute = location.pathname.startsWith('/portal');

  if (isPortalRoute) {
    return <PortalRoutes />;
  }

  return <AdminRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
