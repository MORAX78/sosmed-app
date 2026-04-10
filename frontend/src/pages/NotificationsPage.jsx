import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * NotificationsPage - Halaman notifikasi user.
 * Menampilkan daftar notifikasi (like post/komentar) dari terbaru ke terlama.
 * Fitur: tandai semua dibaca, pagination.
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [marking, setMarking]             = useState(false);

  /** Ambil notifikasi dari API */
  const fetchNotifications = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { page: pageNum } });
      const data = res.data;
      setNotifications(prev => pageNum === 1 ? data.notifications : [...prev, ...data.notifications]);
      setLastPage(data.last_page);
      setPage(pageNum);
    } catch {
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(1); }, []);

  /** Tandai semua notifikasi sebagai sudah dibaca */
  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Semua notifikasi ditandai dibaca');
    } catch {
      toast.error('Gagal');
    } finally {
      setMarking(false);
    }
  };

  /**
   * Tandai satu notifikasi dibaca dan update state lokal.
   * @param {number} id - ID notifikasi
   */
  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  /**
   * Buat teks deskripsi notifikasi berdasarkan tipe.
   * @param {object} notif
   */
  const getNotifText = (notif) => {
    switch (notif.type) {
      case 'post_liked':    return 'menyukai postingan kamu';
      case 'comment_liked': return 'menyukai komentar kamu';
      default:              return 'berinteraksi dengan konten kamu';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* ── Header ── */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-500">{unreadCount} belum dibaca</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={marking}
            className="btn-secondary text-xs py-1.5 px-3">
            {marking ? 'Menandai...' : 'Tandai semua dibaca'}
          </button>
        )}
      </div>

      {/* ── Daftar Notifikasi ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Belum ada notifikasi</p>
          <p className="text-slate-400 text-sm mt-1">Notifikasi akan muncul saat ada yang menyukai postinganmu</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                className={`card p-4 transition-all cursor-pointer hover:shadow-md ${
                  !notif.is_read ? 'border-blue-100 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar aktor */}
                  <Link to={`/profile/${notif.actor?.username}`}
                    className="shrink-0" onClick={e => e.stopPropagation()}>
                    {notif.actor?.avatar_url ? (
                      <img src={notif.actor.avatar_url} alt={notif.actor.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                                      flex items-center justify-center text-white font-bold text-sm">
                        {notif.actor?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <Link to={`/profile/${notif.actor?.username}`}
                        className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                        onClick={e => e.stopPropagation()}>
                        {notif.actor?.name}
                      </Link>
                      {' '}{getNotifText(notif)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: idLocale })}
                    </p>
                  </div>

                  {/* Indikator belum dibaca */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Ikon sesuai tipe notif */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'post_liked' || notif.type === 'comment_liked'
                        ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <svg className="w-4 h-4 text-red-500 fill-red-500" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {page < lastPage && (
            <div className="text-center py-2">
              <button onClick={() => fetchNotifications(page + 1)}
                className="btn-secondary text-sm">Muat lebih banyak</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
