import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * RegisterPage - Form registrasi dengan title di dalam box.
 * Fix: judul dan logo dipindah masuk ke dalam card.
 */
const Field = ({ label, id, type='text', value, placeholder, error, onChange, prefix }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <div className={prefix ? 'relative' : ''}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field ${prefix ? 'pl-7' : ''} ${error ? 'border-red-300 focus:ring-red-500' : ''}`} />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ name:'', username:'', email:'', password:'', password_confirmation:'' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim())     newErrors.name = 'Nama tidak boleh kosong';
    if (!form.username.trim()) newErrors.username = 'Username tidak boleh kosong';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) newErrors.username = 'Hanya huruf, angka, dan underscore';
    if (!form.email.trim())    newErrors.email = 'Email tidak boleh kosong';
    if (form.password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Konfirmasi tidak cocok';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await register(form);
      toast.success('Akun berhasil dibuat!');
      navigate('/');
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        Object.keys(serverErrors).forEach(k => { mapped[k] = serverErrors[k][0]; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Registrasi gagal');
      }
    } finally { setLoading(false); }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="card p-8 shadow-xl shadow-slate-100/80">
          {/* ── Logo + Title di dalam box ── */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SosMedia</h1>
            <p className="text-slate-500 text-sm mt-1">Buat akun baru</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Nama Lengkap" id="name" value={form.name} placeholder="Nama kamu"
              error={errors.name} onChange={v => handleChange('name', v)} />
            <Field label="Username" id="username" value={form.username} placeholder="username_kamu"
              prefix="@" error={errors.username} onChange={v => handleChange('username', v.toLowerCase())} />
            <Field label="Email" id="email" type="email" value={form.email} placeholder="contoh@email.com"
              error={errors.email} onChange={v => handleChange('email', v)} />
            <Field label="Password" id="password" type="password" value={form.password} placeholder="Minimal 6 karakter"
              error={errors.password} onChange={v => handleChange('password', v)} />
            <Field label="Konfirmasi Password" id="confirm" type="password" value={form.password_confirmation}
              placeholder="Ulangi password" error={errors.password_confirmation}
              onChange={v => handleChange('password_confirmation', v)} />

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Membuat akun...
                </span>
              ) : 'Daftar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
