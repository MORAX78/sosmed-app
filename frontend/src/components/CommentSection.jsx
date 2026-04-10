import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Lightbox from './Lightbox';

const MAX_CHARS = 250;

/**
 * CommentSection - Menampilkan, membuat, mengedit, dan menghapus komentar.
 * BUG FIX:
 * - Update komentar kini menggunakan endpoint /comments/{id}/update
 * - Hapus komentar kini menggunakan endpoint /comments/{id}
 * - Tidak lagi nested di /posts/{postId}/comments/{commentId}
 *
 * Fitur baru:
 * - Like komentar dengan optimistic update
 * - Lightbox saat gambar komentar diklik
 * - Link ke profil user komentar
 */
export default function CommentSection({ postId, initialComments = [] }) {
  const { user }  = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent]   = useState('');
  const [image, setImage]       = useState(null);
  const [file, setFile]         = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [editingId, setEditingId]       = useState(null);

  const imageRef = useRef(null);
  const fileRef  = useRef(null);
  const remaining = MAX_CHARS - content.length;

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)); }
  };

  /** Submit komentar baru */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.length > MAX_CHARS) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      if (image) fd.append('image', image);
      if (file)  fd.append('file', file);

      const res = await api.post(`/posts/${postId}/comments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComments(prev => [res.data.comment, ...prev]);
      setContent(''); setImage(null); setFile(null); setImagePreview(null);
      toast.success('Komentar ditambahkan');
    } catch { toast.error('Gagal menambahkan komentar'); }
    finally   { setSubmitting(false); }
  };

  /**
   * Hapus komentar.
   * BUG FIX: endpoint sekarang /comments/{id} bukan /posts/{postId}/comments/{id}
   */
  const handleDelete = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Komentar dihapus');
    } catch { toast.error('Gagal menghapus komentar'); }
  };

  /**
   * Update komentar yang ada.
   * BUG FIX: endpoint sekarang /comments/{id}/update
   */
  const handleUpdate = async (commentId, newContent) => {
    if (!newContent.trim() || newContent.length > MAX_CHARS) return;
    try {
      const fd = new FormData();
      fd.append('content', newContent);
      const res = await api.post(`/comments/${commentId}/update`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setComments(prev => prev.map(c => c.id === commentId ? res.data.comment : c));
      setEditingId(null);
      toast.success('Komentar diupdate');
    } catch { toast.error('Gagal update komentar'); }
  };

  /** Toggle like komentar dengan optimistic update */
  const handleLikeComment = async (commentId) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const newLiked = !c.liked_by_me;
      return { ...c, liked_by_me: newLiked, likes_count: newLiked ? c.likes_count + 1 : c.likes_count - 1 };
    }));
    try {
      const res = await api.post(`/comments/${commentId}/like`);
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, liked_by_me: res.data.liked, likes_count: res.data.likes_count } : c
      ));
    } catch {
      // Rollback
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        return { ...c, liked_by_me: !c.liked_by_me, likes_count: c.liked_by_me ? c.likes_count + 1 : c.likes_count - 1 };
      }));
      toast.error('Gagal like komentar');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Form komentar baru ── */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2.5">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 shrink-0 mt-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                            flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="relative">
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Tulis komentar... #hashtag juga bisa!" rows={2}
                className={`input-field resize-none text-sm ${remaining < 0 ? 'border-red-300' : ''}`} />
              <span className={`absolute bottom-2 right-2 text-xs font-medium
                ${remaining < 0 ? 'text-red-500' : remaining < 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                {remaining}
              </span>
            </div>

            {imagePreview && (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-24 rounded-lg border border-slate-200" />
                <button type="button" onClick={() => { setImage(null); setImagePreview(null); if (imageRef.current) imageRef.current.value=''; }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
              </div>
            )}
            {file && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-600">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value=''; }}
                  className="text-red-400 font-bold shrink-0">×</button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <label className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input ref={imageRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
                <label className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>
              </div>
              <button type="submit" disabled={submitting || !content.trim() || remaining < 0}
                className="btn-primary text-xs py-1.5 px-4">
                {submitting ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Daftar komentar ── */}
      {comments.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">Belum ada komentar.</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} currentUser={user}
              onDelete={handleDelete} onUpdate={handleUpdate}
              onLike={handleLikeComment}
              isEditing={editingId === comment.id}
              onStartEdit={() => setEditingId(comment.id)}
              onCancelEdit={() => setEditingId(null)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * CommentItem - Satu item komentar dengan like, lightbox, edit/hapus.
 */
function CommentItem({ comment, currentUser, onDelete, onUpdate, onLike, isEditing, onStartEdit, onCancelEdit }) {
  const [editContent, setEditContent] = useState(comment.content);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const isOwner = currentUser?.id === comment.user?.id;

  if (isEditing) {
    return (
      <div className="flex gap-2.5 animate-fade-in">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                        flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
          {comment.user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-2">
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            rows={2} className="input-field resize-none text-sm" autoFocus
            maxLength={250} />
          <div className="flex gap-2 justify-end">
            <button onClick={onCancelEdit} className="btn-secondary text-xs py-1 px-3">Batal</button>
            <button onClick={() => onUpdate(comment.id, editContent)} className="btn-primary text-xs py-1 px-3">Simpan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 animate-fade-in">
      {/* Avatar dengan link ke profil */}
      <Link to={`/profile/${comment.user?.username}`} className="shrink-0 mt-0.5">
        {comment.user?.avatar_url ? (
          <img src={comment.user.avatar_url} alt={comment.user.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 hover:opacity-80 transition-opacity" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600
                          flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition-opacity">
            {comment.user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link to={`/profile/${comment.user?.username}`}
                className="text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate">
                {comment.user?.name}
              </Link>
              <span className="text-xs text-slate-400 shrink-0">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: idLocale })}
              </span>
            </div>
            {isOwner && (
              <div className="flex gap-1 shrink-0">
                <button onClick={onStartEdit}
                  className="p-1 rounded text-slate-300 hover:text-blue-500 transition-all">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(comment.id)}
                  className="p-1 rounded text-slate-300 hover:text-red-500 transition-all">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Isi komentar */}
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {comment.content.split(/(\s+)/).map((word, i) =>
              word.startsWith('#')
                ? <span key={i} className="text-blue-500 font-medium">{word}</span>
                : word
            )}
          </p>

          {/* Hashtag pills */}
          {comment.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {comment.hashtags.map(tag => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Like komentar */}
          <div className="mt-2 pt-1.5 border-t border-slate-50">
            <button onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-all active:scale-90 ${
                comment.liked_by_me ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
              }`}>
              <svg className={`w-3.5 h-3.5 transition-all ${comment.liked_by_me ? 'fill-red-500' : 'fill-none'}`}
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {comment.likes_count || 0}
            </button>
          </div>
        </div>

        {/* Gambar komentar (klik untuk lightbox) */}
        {comment.image_url && (
          <img src={comment.image_url} alt="Comment"
            className="mt-1.5 max-h-32 rounded-xl object-cover border border-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
            onClick={() => setLightboxSrc(comment.image_url)} />
        )}

        {/* File komentar */}
        {comment.file_url && (
          <a href={comment.file_url} target="_blank" rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {comment.file_name || 'Unduh file'}
          </a>
        )}
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} alt="Comment image" onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
