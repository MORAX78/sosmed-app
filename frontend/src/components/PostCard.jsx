import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';
import PostForm from './PostForm';
import Lightbox from './Lightbox';

/**
 * PostCard - Kartu postingan lengkap dengan:
 * - Like button dengan optimistic update
 * - Lightbox saat gambar diklik
 * - Edit/hapus inline (hanya pemilik)
 * - Link ke profil user
 * - Toggle section komentar
 */
export default function PostCard({ post, onDelete, onUpdate }) {
  const { user }             = useAuth();
  const [liked, setLiked]    = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null); // URL gambar lightbox

  const isOwner = user?.id === post.user?.id;

  /**
   * Toggle like pada postingan.
   * Menggunakan optimistic update: UI diupdate dulu, baru sync ke server.
   */
  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likesCount;
    // Optimistic update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch {
      // Rollback jika gagal
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error('Gagal like postingan');
    }
  };

  /** Hapus postingan setelah konfirmasi */
  const handleDelete = async () => {
    if (!window.confirm('Hapus postingan ini?')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Postingan dihapus');
      onDelete(post.id);
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="card p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Edit Postingan</span>
          <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <PostForm
          initialData={post}
          onSuccess={(updated) => { setIsEditing(false); onUpdate(updated); }}
          onCancel={() => setIsEditing(false)}
          isEdit
        />
      </div>
    );
  }

  return (
    <article className="card overflow-hidden animate-slide-up">
      {/* ── Header ── */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <Link to={`/profile/${post.user?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {post.user?.avatar_url ? (
              <img src={post.user.avatar_url} alt={post.user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                              flex items-center justify-center text-white font-bold text-sm shrink-0">
                {post.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-slate-800 hover:text-blue-600 transition-colors">
                {post.user?.name}
              </p>
              <p className="text-xs text-slate-400">
                @{post.user?.username} ·{' '}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: idLocale })}
              </p>
            </div>
          </Link>

          {isOwner && (
            <div className="flex gap-1">
              <button onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Konten teks */}
        <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content.split(/(\s+)/).map((word, i) =>
            word.startsWith('#')
              ? <span key={i} className="text-blue-500 font-medium">{word}</span>
              : word
          )}
        </p>

        {/* Hashtag pills */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map(tag => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Gambar (klik untuk lightbox) ── */}
      {post.image_url && (
        <div className="mt-3 mx-4">
          <img src={post.image_url} alt="Post"
            className="w-full rounded-xl object-cover max-h-80 border border-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
            onClick={() => setLightboxSrc(post.image_url)}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* ── File attachment ── */}
      {post.file_url && (
        <div className="mx-4 mt-3">
          <a href={post.file_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200
                       hover:bg-slate-100 transition-all text-sm text-slate-600 group">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="flex-1 truncate font-medium">{post.file_name || 'File lampiran'}</span>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      )}

      {/* ── Action bar: Like + Komentar ── */}
      <div className="p-4 pt-3 mt-1 border-t border-slate-50 flex items-center gap-4">
        {/* Like button */}
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all active:scale-90 ${
            liked ? 'text-red-500' : 'text-slate-500 hover:text-red-400'
          }`}>
          <svg className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 scale-110' : 'fill-none'}`}
            stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likesCount}</span>
        </button>

        {/* Komentar button */}
        <button onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-500 transition-all font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments_count || post.comments?.length || 0}</span>
          <svg className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Komentar section ── */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3">
          <CommentSection postId={post.id} initialComments={post.comments || []} />
        </div>
      )}

      {/* ── Lightbox overlay ── */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt="Post image" onClose={() => setLightboxSrc(null)} />
      )}
    </article>
  );
}
