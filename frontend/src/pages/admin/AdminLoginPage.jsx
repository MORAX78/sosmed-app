import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * AdminLoginPage - Halaman login khusus untuk super admin.
 * Menyimpan admin_token terpisah dari token user biasa.
 * Akses: /admin/login
 */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  /**
   * Submit login admin.
   * Jika berhasil, simpan admin_token dan redirect ke dashboard.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Isi semua field!');
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin', JSON.stringify(res.data.admin));
      toast.success('Selamat datang, Admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kredensial tidak valid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                    flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-900/50">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">SosMedia Super Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Admin</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@sosmed.com"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5
                           text-sm text-white placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password admin"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5
                             text-sm text-white placeholder:text-slate-500 pr-10
                             focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPass
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      } />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold
                         py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         active:scale-95 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : 'Masuk sebagai Admin'}
            </button>
          </form>

          <div className="mt-5 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
            <p className="text-xs text-slate-400 text-center">
              Default: <span className="text-amber-400 font-mono">admin@sosmed.com</span> / <span className="text-amber-400 font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
