import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * AuthContext - State autentikasi global untuk user biasa.
 * BUG FIX: Setelah register/login, data user diambil ulang dari /me
 * agar selalu sinkron dengan database (bukan dari response register saja).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Ambil data user terbaru dari server berdasarkan token tersimpan.
   * Dipanggil saat app pertama kali load dan setelah login/register.
   */
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return null; }
    try {
      const res = await api.get('/me');
      const u = res.data.user;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      return u;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verifikasi token saat app mount
  useEffect(() => { fetchMe(); }, [fetchMe]);

  /**
   * Login - simpan token lalu fetch data user yang sebenarnya.
   * BUG FIX: tidak lagi langsung setUser dari response login,
   * melainkan fetch /me agar data selalu akurat.
   */
  const login = useCallback(async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('token', res.data.token);
    // Fetch user dari server untuk memastikan data benar
    await fetchMe();
    return res.data;
  }, [fetchMe]);

  /**
   * Register - sama seperti login, fetch /me setelah berhasil.
   */
  const register = useCallback(async (data) => {
    const res = await api.post('/register', data);
    localStorage.setItem('token', res.data.token);
    await fetchMe();
    return res.data;
  }, [fetchMe]);

  /** Logout - bersihkan semua state dan storage */
  const logout = useCallback(async () => {
    try { await api.post('/logout'); } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  /**
   * Update data user lokal setelah edit profil.
   * Juga sinkronkan dengan localStorage.
   */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}
