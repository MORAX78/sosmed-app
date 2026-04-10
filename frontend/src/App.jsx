import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import HomePage      from './pages/HomePage';
import ProfilePage   from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminLoginPage    from './pages/admin/AdminLoginPage';
import AdminDashboard    from './pages/admin/AdminDashboard';
import Layout        from './components/Layout';

/** Route yang butuh login user biasa */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

/** Route untuk tamu (belum login) */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? children : <Navigate to="/" replace />;
}

/** Route untuk admin (cek admin_token di localStorage) */
function AdminRoute({ children }) {
  const adminToken = localStorage.getItem('admin_token');
  return adminToken ? children : <Navigate to="/admin/login" replace />;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Admin routes */}
      <Route path="/admin/login"     element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Protected user routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index                    element={<HomePage />} />
        <Route path="profile"           element={<ProfilePage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="notifications"     element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
