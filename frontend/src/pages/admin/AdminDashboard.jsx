import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * AdminDashboard - Panel kontrol super admin.
 * Tab: Statistik | User | Postingan | Komentar | Filter Kata
 *
 * Fitur:
 * - Statistik ringkasan (total user, post, komentar, filter)
 * - Manajemen user (lihat, hapus, search)
 * - Manajemen postingan (lihat, hapus, search konten)
 * - Manajemen komentar (lihat, hapus, search konten)
 * - Manajemen filter kata (tambah, hapus kata terlarang)
 */
export default function AdminDashboard() {
  const navigate    = useNavigate();
  const adminData   = JSON.parse(localStorage.getItem('admin') || '{}');
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats]         = useState(null);

  /** Setup axios dengan admin token */
  const adminApi = {
    get: (url, config) => api.get(url, {
      ...config,
      headers: { ...config?.headers, Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    }),
    post: (url, data, config) => api.post(url, data, {
      ...config,
      headers: { ...config?.headers, Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    }),
    delete: (url) => api.delete(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    }),
  };

  /** Logout admin */
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    navigate('/admin/login');
    toast.success('Logout berhasil');
  };

  /** Ambil statistik dashboard */
  useEffect(() => {
    adminApi.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(() => toast.error('Gagal memuat statistik'));
  }, []);

  const tabs = [
    { id: 'stats',    label: 'Statistik',   icon: '📊' },
    { id: 'users',    label: 'User',        icon: '👥' },
    { id: 'posts',    label: 'Postingan',   icon: '📝' },
    { id: 'comments', label: 'Komentar',    icon: '💬' },
    { id: 'filters',  label: 'Filter Kata', icon: '🚫' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ── Top Bar ── */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white">SosMedia Admin</h1>
              <p className="text-xs text-slate-400">Panel Kontrol</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Halo, <span className="text-amber-400 font-medium">{adminData.name}</span></span>
            <button onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'stats'    && <StatsTab stats={stats} />}
        {activeTab === 'users'    && <UsersTab adminApi={adminApi} />}
        {activeTab === 'posts'    && <PostsTab adminApi={adminApi} />}
        {activeTab === 'comments' && <CommentsTab adminApi={adminApi} />}
        {activeTab === 'filters'  && <FiltersTab adminApi={adminApi} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────────────────
/**
 * StatsTab - Menampilkan kartu statistik ringkasan dashboard.
 */
function StatsTab({ stats }) {
  if (!stats) return <LoadingCards />;

  const cards = [
    { label: 'Total User',      value: stats.total_users,    color: 'blue',   icon: '👥' },
    { label: 'Total Postingan', value: stats.total_posts,    color: 'green',  icon: '📝' },
    { label: 'Total Komentar',  value: stats.total_comments, color: 'purple', icon: '💬' },
    { label: 'Filter Kata',     value: stats.total_filters,  color: 'red',    icon: '🚫' },
  ];

  const colorMap = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`rounded-xl border p-5 ${colorMap[card.color]}`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value?.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* User terbaru */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-semibold text-slate-200 mb-4">User Terbaru Bergabung</h3>
        <div className="space-y-3">
          {stats.recent_users?.map(u => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-200">{u.name}</p>
                <p className="text-xs text-slate-500">@{u.username} · {u.email}</p>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(u.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────────────────
/**
 * UsersTab - Tabel semua user dengan search dan hapus.
 */
function UsersTab({ adminApi }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]   = useState(0);

  const fetchUsers = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/users', { params: { search: q, page: p } });
      setUsers(res.data.users);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
      setPage(p);
    } catch { toast.error('Gagal memuat user'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(search, 1); };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus user "${name}"? Semua postingan & komentarnya ikut terhapus.`)) return;
    try {
      await adminApi.delete(`/admin/users/${id}`);
      toast.success('User dihapus');
      fetchUsers(search, page);
    } catch { toast.error('Gagal menghapus user'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">Manajemen User <span className="text-slate-500 text-sm font-normal">({total} total)</span></h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..."
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500" />
          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-lg transition-all">
            Cari
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchUsers('', 1); }}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-2 rounded-lg transition-all">×</button>
          )}
        </form>
      </div>

      {loading ? <LoadingTable /> : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">User</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Post</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Komentar</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Bergabung</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada user ditemukan</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                      }
                      <div>
                        <p className="font-medium text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{u.posts_count}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{u.comments_count}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(u.id, u.name)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-all">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} lastPage={lastPage} onPrev={() => fetchUsers(search, page-1)} onNext={() => fetchUsers(search, page+1)} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// POSTS TAB
// ─────────────────────────────────────────────────────────
/**
 * PostsTab - Tabel semua postingan dengan search konten dan hapus.
 */
function PostsTab({ adminApi }) {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]   = useState(0);

  const fetchPosts = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/posts', { params: { search: q, page: p } });
      setPosts(res.data.posts);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
      setPage(p);
    } catch { toast.error('Gagal memuat postingan'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus postingan ini?')) return;
    try {
      await adminApi.delete(`/admin/posts/${id}`);
      toast.success('Postingan dihapus');
      fetchPosts(search, page);
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-200">Kelola Postingan <span className="text-slate-500 text-sm font-normal">({total} total)</span></h2>
        <form onSubmit={e => { e.preventDefault(); fetchPosts(search, 1); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari konten..."
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500" />
          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-lg transition-all">Cari</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchPosts('', 1); }}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-2 rounded-lg">×</button>
          )}
        </form>
      </div>

      {loading ? <LoadingTable /> : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Konten</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">User</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">❤️</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">💬</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Tanggal</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada postingan</td></tr>
              ) : posts.map(p => (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-750">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-slate-300 line-clamp-2 text-xs">{p.content}</p>
                    {p.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.hashtags.map(t => (
                          <span key={t} className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">#{t}</span>
                        ))}
                      </div>
                    )}
                    {p.image_url && <span className="text-[10px] text-slate-500 mt-1 block">📷 Ada gambar</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm font-medium text-slate-300">{p.user?.name}</p>
                    <p className="text-xs text-slate-500">@{p.user?.username}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{p.likes_count}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{p.comments_count}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-all">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} lastPage={lastPage} onPrev={() => fetchPosts(search, page-1)} onNext={() => fetchPosts(search, page+1)} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// COMMENTS TAB
// ─────────────────────────────────────────────────────────
/**
 * CommentsTab - Tabel semua komentar dengan search dan hapus.
 */
function CommentsTab({ adminApi }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);

  const fetchComments = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/comments', { params: { search: q, page: p } });
      setComments(res.data.comments);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
      setPage(p);
    } catch { toast.error('Gagal memuat komentar'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchComments(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await adminApi.delete(`/admin/comments/${id}`);
      toast.success('Komentar dihapus');
      fetchComments(search, page);
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-200">Kelola Komentar <span className="text-slate-500 text-sm font-normal">({total} total)</span></h2>
        <form onSubmit={e => { e.preventDefault(); fetchComments(search, 1); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari komentar..."
            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500" />
          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-lg">Cari</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchComments('', 1); }}
              className="bg-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg">×</button>
          )}
        </form>
      </div>

      {loading ? <LoadingTable /> : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-slate-400 font-medium">Komentar</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">User</th>
                <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Di Postingan</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">❤️</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Tanggal</th>
                <th className="px-4 py-3 text-slate-400 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {comments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada komentar</td></tr>
              ) : comments.map(c => (
                <tr key={c.id} className="border-b border-slate-700/50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-slate-300 line-clamp-2 text-xs">{c.content}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm font-medium text-slate-300">{c.user?.name}</p>
                    <p className="text-xs text-slate-500">@{c.user?.username}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                    {c.post?.content ? `"${c.post.content}"` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{c.likes_count}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {new Date(c.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded text-xs transition-all">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} lastPage={lastPage} onPrev={() => fetchComments(search, page-1)} onNext={() => fetchComments(search, page+1)} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// WORD FILTERS TAB
// ─────────────────────────────────────────────────────────
/**
 * FiltersTab - Kelola daftar kata terlarang.
 * Kata yang ditambahkan akan otomatis disensor di semua postingan/komentar baru.
 */
function FiltersTab({ adminApi }) {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [adding, setAdding]   = useState(false);

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/word-filters');
      setFilters(res.data.filters);
    } catch { toast.error('Gagal memuat filter'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchFilters(); }, []);

  /** Tambah kata filter baru */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setAdding(true);
    try {
      const res = await adminApi.post('/admin/word-filters', { word: newWord.trim() });
      setFilters(prev => [...prev, res.data.filter].sort((a,b) => a.word.localeCompare(b.word)));
      setNewWord('');
      toast.success(`Kata "${newWord.trim()}" ditambahkan ke filter`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan');
    } finally { setAdding(false); }
  };

  /** Hapus kata filter */
  const handleDelete = async (id, word) => {
    if (!window.confirm(`Hapus filter kata "${word}"?`)) return;
    try {
      await adminApi.delete(`/admin/word-filters/${id}`);
      setFilters(prev => prev.filter(f => f.id !== id));
      toast.success(`Filter "${word}" dihapus`);
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-200">Filter Kata Terlarang</h2>
      <p className="text-sm text-slate-400">
        Kata yang ditambahkan akan otomatis disensor (<span className="font-mono text-amber-400">****</span>) pada setiap postingan dan komentar baru.
      </p>

      {/* Form tambah kata */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-medium text-slate-300 mb-3">Tambah Kata Baru</h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input value={newWord} onChange={e => setNewWord(e.target.value.toLowerCase())}
            placeholder="Masukkan kata yang dilarang..."
            className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-4 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500" />
          <button type="submit" disabled={adding || !newWord.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-5 py-2.5 rounded-lg
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {adding ? 'Menambahkan...' : 'Tambahkan'}
          </button>
        </form>
      </div>

      {/* Daftar kata */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="font-medium text-slate-300 mb-4">
          Daftar Kata Terfilter <span className="text-slate-500 text-sm font-normal">({filters.length} kata)</span>
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filters.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Belum ada kata yang difilter</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <div key={f.id}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400
                           rounded-lg px-3 py-1.5">
                <span className="text-sm font-mono">{f.word}</span>
                <button onClick={() => handleDelete(f.id, f.word)}
                  className="hover:text-red-200 transition-colors text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────
function Pagination({ page, lastPage, onPrev, onNext }) {
  if (lastPage <= 1) return null;
  return (
    <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
      <span className="text-xs text-slate-500">Halaman {page} dari {lastPage}</span>
      <div className="flex gap-2">
        <button onClick={onPrev} disabled={page <= 1}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
        <button onClick={onNext} disabled={page >= lastPage}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-28" />
      ))}
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-pulse space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-10 bg-slate-700 rounded" />
      ))}
    </div>
  );
}
