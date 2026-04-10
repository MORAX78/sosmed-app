import { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/** Batas maksimum karakter konten postingan/komentar */
const MAX_CHARS = 250;

/**
 * PostForm - Form untuk membuat atau mengedit postingan.
 * Mendukung input teks, upload gambar, dan upload file.
 * Menghitung sisa karakter secara real-time.
 *
 * @param {object}   initialData - Data awal saat mode edit (optional)
 * @param {function} onSuccess   - Callback dipanggil setelah berhasil simpan, menerima data post
 * @param {function} onCancel    - Callback dipanggil saat user membatalkan
 * @param {boolean}  isEdit      - true jika mode edit, false jika mode buat baru
 */
export default function PostForm({ initialData = null, onSuccess, onCancel, isEdit = false }) {
  const [content,   setContent]   = useState(initialData?.content || '');
  const [image,     setImage]     = useState(null);
  const [file,      setFile]      = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,   setLoading]   = useState(false);

  const imageInputRef = useRef(null);
  const fileInputRef  = useRef(null);

  /** Sisa karakter yang tersedia */
  const remaining = MAX_CHARS - content.length;

  /**
   * Menangani perubahan input gambar.
   * Membuat preview URL untuk menampilkan gambar sebelum upload.
   *
   * @param {Event} e - Event change dari input file
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    // Buat URL sementara untuk preview gambar
    setImagePreview(URL.createObjectURL(file));
  };

  /**
   * Menangani perubahan input file biasa (non-gambar).
   *
   * @param {Event} e - Event change dari input file
   */
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  /** Menghapus gambar yang sudah dipilih */
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  /** Menghapus file yang sudah dipilih */
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Submit form - kirim data ke API (create atau update).
   * Menggunakan FormData karena ada upload file.
   *
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Konten tidak boleh kosong');
    if (content.length > MAX_CHARS) return toast.error(`Maksimal ${MAX_CHARS} karakter`);

    setLoading(true);
    try {
      // Gunakan FormData agar bisa mengirim file bersama data teks
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('image', image);
      if (file)  formData.append('file', file);

      let res;
      if (isEdit) {
        // Mode edit: kirim ke endpoint update
        res = await api.post(`/posts/${initialData.id}/update`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Postingan diupdate!');
        onSuccess(res.data.post);
      } else {
        // Mode baru: kirim ke endpoint create
        res = await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Postingan dibuat!');
        onSuccess(res.data.post);
        // Reset form setelah berhasil membuat post baru
        setContent('');
        setImage(null);
        setFile(null);
        setImagePreview(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* ─── Textarea konten ─── */}
      <div className="relative">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Apa yang sedang kamu pikirkan? Gunakan #hashtag untuk kategorisasi..."
          rows={3}
          className={`input-field resize-none text-sm leading-relaxed
            ${remaining < 0 ? 'border-red-300 focus:ring-red-500' : ''}`}
        />
        {/* Counter karakter */}
        <span className={`absolute bottom-2.5 right-3 text-xs font-medium
          ${remaining < 0 ? 'text-red-500' : remaining < 30 ? 'text-amber-500' : 'text-slate-400'}`}>
          {remaining}
        </span>
      </div>

      {/* ─── Preview gambar yang dipilih ─── */}
      {imagePreview && (
        <div className="relative inline-block">
          <img src={imagePreview} alt="Preview"
            className="max-h-40 rounded-xl object-cover border border-slate-200" />
          <button type="button" onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full
                       text-xs flex items-center justify-center hover:bg-red-600 transition-all">
            ×
          </button>
        </div>
      )}

      {/* ─── Info file yang dipilih ─── */}
      {file && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 truncate text-slate-600">{file.name}</span>
          <button type="button" onClick={removeFile}
            className="text-red-400 hover:text-red-500 font-bold text-lg leading-none">×</button>
        </div>
      )}

      {/* ─── Toolbar aksi & tombol submit ─── */}
      <div className="flex items-center justify-between pt-1">
        {/* Tombol upload */}
        <div className="flex gap-2">
          {/* Upload gambar */}
          <label className="cursor-pointer p-2 rounded-xl text-slate-400 hover:text-blue-500
                            hover:bg-blue-50 transition-all" title="Tambah gambar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              ref={imageInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>

          {/* Upload file */}
          <label className="cursor-pointer p-2 rounded-xl text-slate-400 hover:text-blue-500
                            hover:bg-blue-50 transition-all" title="Lampirkan file">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Tombol aksi */}
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !content.trim() || remaining < 0}
            className="btn-primary text-sm py-2 px-5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              isEdit ? 'Simpan' : 'Posting'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
