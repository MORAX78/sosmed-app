import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PostForm from '../components/PostForm';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

/**
 * HomePage - Halaman beranda yang menampilkan feed semua postingan.
 * Fitur:
 * - Form buat postingan baru di bagian atas
 * - Filter postingan berdasarkan hashtag
 * - Daftar postingan diurutkan dari yang terbaru (infinite scroll sederhana)
 */
export default function HomePage() {
  const { user }                = useAuth();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hashtag, setHashtag]   = useState('');        // filter hashtag aktif
  const [search, setSearch]     = useState('');        // input search hashtag
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * Mengambil data postingan dari API.
   * Mendukung filter hashtag dan pagination.
   *
   * @param {number}  pageNum   - Nomor halaman yang diambil
   * @param {string}  tagFilter - Filter hashtag (kosong = semua)
   * @param {boolean} reset     - true jika reset ke halaman 1 (misalnya saat ganti filter)
   */
  const fetchPosts = useCallback(async (pageNum = 1, tagFilter = '', reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { page: pageNum };
      if (tagFilter) params.hashtag = tagFilter;

      const res = await api.get('/posts', { params });
      const newPosts = res.data.posts;

      // Jika reset (filter baru), ganti semua post; jika load more, append
      setPosts(prev => reset || pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      setLastPage(res.data.last_page);
      setPage(pageNum);
    } catch {
      toast.error('Gagal memuat postingan');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Muat postingan saat komponen pertama kali ditampilkan
  useEffect(() => {
    fetchPosts(1, hashtag, true);
  }, [hashtag, fetchPosts]);

  /**
   * Menerapkan filter hashtag dari input search.
   * Dipanggil saat user submit form search.
   *
   * @param {Event} e - Submit event form
   */
  const handleSearch = (e) => {
    e.preventDefault();
    // Bersihkan tanda # jika user mengetikkan #hashtag
    const clean = search.replace(/^#/, '').trim();
    setHashtag(clean);
    setPage(1);
  };

  /**
   * Reset filter hashtag dan tampilkan semua postingan.
   */
  const clearFilter = () => {
    setHashtag('');
    setSearch('');
  };

  /**
   * Callback setelah postingan baru berhasil dibuat.
   * Tambahkan post baru ke bagian atas daftar.
   *
   * @param {object} newPost - Data postingan baru
   */
  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  /**
   * Callback setelah postingan berhasil dihapus.
   * Hapus post dari daftar berdasarkan ID.
   *
   * @param {number} postId - ID postingan yang dihapus
   */
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  /**
   * Callback setelah postingan berhasil diupdate.
   * Ganti data post lama dengan yang baru di daftar.
   *
   * @param {object} updatedPost - Data postingan terbaru
   */
  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">

      {/* ─── Form buat postingan baru ─── */}
      <div className="card p-4">
        <div className="flex gap-3">
          {/* Avatar user */}
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                            flex items-center justify-center text-white font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <PostForm onSuccess={handlePostCreated} />
          </div>
        </div>
      </div>

      {/* ─── Filter Hashtag ─── */}
      <div className="card p-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">#</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter berdasarkan hashtag..."
              className="input-field pl-7 text-sm py-2"
            />
          </div>
          <button type="submit" className="btn-primary text-sm py-2 px-4">Filter</button>
          {hashtag && (
            <button type="button" onClick={clearFilter}
              className="btn-secondary text-sm py-2 px-3">
              ×
            </button>
          )}
        </form>

        {/* Indikator filter aktif */}
        {hashtag && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Menampilkan hasil untuk:</span>
            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-medium text-xs">
              #{hashtag}
            </span>
          </div>
        )}
      </div>

      {/* ─── Daftar Postingan ─── */}
      {loading ? (
        // Skeleton loading
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        // State kosong
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">
            {hashtag ? `Tidak ada postingan dengan #${hashtag}` : 'Belum ada postingan'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {hashtag ? 'Coba hashtag lain' : 'Jadilah yang pertama posting!'}
          </p>
        </div>
      ) : (
        // Daftar post
        <>
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                onUpdate={handlePostUpdated}
              />
            ))}
          </div>

          {/* Tombol Load More */}
          {page < lastPage && (
            <div className="text-center py-4">
              <button
                onClick={() => fetchPosts(page + 1, hashtag)}
                disabled={loadingMore}
                className="btn-secondary text-sm"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Memuat...
                  </span>
                ) : (
                  'Muat lebih banyak'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
