import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * ProfilePage - Profil user.
 * - Profil sendiri: bisa edit nama, bio, foto
 * - Profil user lain: read-only
 */
export default function ProfilePage() {
  const { username }   = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName]  = useState('');
  const [bio, setBio]    = useState('');
  const [avatar, setAvatar]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const avatarInputRef = useRef(null);

  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          const res = await api.get('/me');
          setProfile(res.data.user);
          setName(res.data.user.name || '');
          setBio(res.data.user.bio || '');
        } else {
          const res = await api.get(`/users/${username}`);
          setProfile(res.data.user);
        }
      } catch { toast.error('Gagal memuat profil'); }
      finally  { setLoading(false); }
    };
    load();
  }, [username, isOwnProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('bio', bio);
      if (avatar) fd.append('avatar', avatar);
      const res = await api.post('/profile/update', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data.user;
      setProfile(updated);
      updateUser(updated);
      setIsEditing(false);
      setAvatar(null);
      setAvatarPreview(null);
      toast.success('Profil berhasil diupdate!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal update profil');
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(profile?.name || '');
    setBio(profile?.bio || '');
    setAvatar(null);
    setAvatarPreview(null);
  };

  if (loading) return (
    <div className="card p-8 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="card p-12 text-center">
      <p className="text-slate-500">Profil tidak ditemukan</p>
    </div>
  );

  const displayAvatar = avatarPreview || profile.avatar_url;

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {displayAvatar ? (
              <img src={displayAvatar} alt={profile.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600
                              flex items-center justify-center text-white font-bold text-3xl ring-4 ring-slate-100">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full
                                flex items-center justify-center cursor-pointer hover:bg-blue-600
                                transition-all shadow-lg border-2 border-white">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {/* Info profil */}
          <div className="flex-1 min-w-0">
            {isEditing && isOwnProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nama</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="input-field text-sm" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    maxLength={500} className="input-field text-sm resize-none"
                    placeholder="Ceritakan sedikit tentang dirimu..." />
                  <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/500</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : 'Simpan'}
                  </button>
                  <button onClick={handleCancelEdit} className="btn-secondary text-sm">Batal</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">{profile.name}</h1>
                    <p className="text-sm text-slate-400">@{profile.username}</p>
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => setIsEditing(true)}
                      className="btn-secondary text-sm flex items-center gap-1.5 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profil
                    </button>
                  )}
                </div>
                {profile.bio
                  ? <p className="text-sm text-slate-600 mt-3 leading-relaxed">{profile.bio}</p>
                  : isOwnProfile && <p className="text-sm text-slate-400 mt-3 italic">Belum ada bio.</p>
                }
                {(profile.posts_count !== undefined) && (
                  <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <span className="block text-lg font-bold text-slate-800">{profile.posts_count ?? 0}</span>
                      <span className="text-xs text-slate-400">Postingan</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-slate-800">{profile.comments_count ?? 0}</span>
                      <span className="text-xs text-slate-400">Komentar</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Informasi Akun</h2>
        <div className="space-y-2">
          {isOwnProfile && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {profile.email}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
