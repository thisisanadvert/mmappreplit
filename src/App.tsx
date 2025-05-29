import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import RTMDashboard from './pages/dashboards/RTMDashboard';
import LeaseholderDashboard from './pages/dashboards/LeaseholderDashboard';
import ManagementDashboard from './pages/dashboards/ManagementDashboard';
import IssuesManagement from './pages/IssuesManagement';
import Finances from './pages/Finances';
import Documents from './pages/Documents';
import Announcements from './pages/Announcements';
import Voting from './pages/Voting';
import AGMs from './pages/AGMs';
import RTMManagement from './pages/RTMManagement';
import ShareCertificates from './pages/ShareCertificates';
import SupplierNetwork from './pages/SupplierNetwork';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import BuildingSetup from './pages/BuildingSetup';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.role || !allowedRoles.includes(user.role)) {
    const redirectPath = user?.role ? `/${user.role.split('-')[0]}` : '/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user } = useAuth();
  const location = useLocation();

  // Prevent landing page access for logged-in users
  if (user && (location.pathname === '/' || location.pathname === '/pricing')) {
    const basePath = user.role?.split('-')[0];
    return <Navigate to={`/${basePath}`} replace />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!user ? <Landing /> : <Navigate to={`/${user.role?.split('-')[0]}`} replace />} />
        <Route path="/pricing" element={!user ? <Pricing /> : <Navigate to={`/${user.role?.split('-')[0]}`} replace />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to={`/${user.role?.split('-')[0]}`} replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Profile and Settings routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Profile />} />
        </Route>

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Settings />} />
        </Route>
        
        {/* RTM Director Routes */}
        <Route
          path="/rtm/*"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['rtm-director']}>
                <MainLayout />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<RTMDashboard />} />
          <Route path="issues" element={<IssuesManagement />} />
          <Route path="finances" element={<Finances />} />
          <Route path="documents" element={<Documents />} />
          <Route path="building-setup" element={<BuildingSetup />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="voting" element={<Voting />} />
          <Route path="agms" element={<AGMs />} />
          <Route path="rtm" element={<RTMManagement />} />
          <Route path="suppliers" element={<SupplierNetwork />} />
        </Route>

        {/* SOF Director Routes */}
        <Route
          path="/sof/*"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['sof-director']}>
                <MainLayout />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<RTMDashboard />} />
          <Route path="issues" element={<IssuesManagement />} />
          <Route path="finances" element={<Finances />} />
          <Route path="documents" element={<Documents />} />
          <Route path="building-setup" element={<BuildingSetup />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="voting" element={<Voting />} />
          <Route path="agms" element={<AGMs />} />
          <Route path="shares" element={<ShareCertificates />} />
          <Route path="suppliers" element={<SupplierNetwork />} />
        </Route>

        {/* Shareholder Routes */}
        <Route
          path="/shareholder/*"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['shareholder']}>
                <MainLayout />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<LeaseholderDashboard />} />
          <Route path="issues" element={<IssuesManagement />} />
          <Route path="finances" element={<Finances />} />
          <Route path="documents" element={<Documents />} />
          <Route path="building-setup" element={<BuildingSetup />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="voting" element={<Voting />} />
          <Route path="agms" element={<AGMs />} />
        </Route>

        {/* Leaseholder Routes */}
        <Route
          path="/leaseholder/*"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['leaseholder']}>
                <MainLayout />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<LeaseholderDashboard />} />
          <Route path="issues" element={<IssuesManagement />} />
          <Route path="finances" element={<Finances />} />
          <Route path="documents" element={<Documents />} />
          <Route path="building-setup" element={<BuildingSetup />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="voting" element={<Voting />} />
          <Route path="agms" element={<AGMs />} />
        </Route>

        {/* Management Company Routes */}
        <Route
          path="/management/*"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={['management-company']}>
                <MainLayout />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          <Route index element={<ManagementDashboard />} />
          <Route path="issues" element={<IssuesManagement />} />
          <Route path="finances" element={<Finances />} />
          <Route path="documents" element={<Documents />} />
          <Route path="building-setup" element={<BuildingSetup />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="voting" element={<Voting />} />
          <Route path="agms" element={<AGMs />} />
          <Route path="suppliers" element={<SupplierNetwork />} />
        </Route>

        {/* Redirect unknown routes to appropriate dashboard */}
        <Route path="*" element={
          user ? (
            <Navigate to={`/${user.role?.split('-')[0]}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;