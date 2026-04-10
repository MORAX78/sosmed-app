import { useEffect, useCallback } from 'react';

/**
 * Lightbox - Komponen overlay untuk menampilkan gambar dalam ukuran penuh.
 * Bisa ditutup dengan klik di luar gambar, tombol close, atau tekan Escape.
 *
 * @param {string}   src     - URL gambar yang ditampilkan
 * @param {string}   alt     - Alt text gambar
 * @param {function} onClose - Callback saat lightbox ditutup
 */
export default function Lightbox({ src, alt = 'Image', onClose }) {
  /**
   * Tutup lightbox saat user menekan tombol Escape.
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Cegah scroll halaman saat lightbox terbuka
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Tombol close di pojok kanan atas */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20
                   rounded-full flex items-center justify-center text-white transition-all z-10"
        aria-label="Tutup"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Gambar utama - klik gambar tidak menutup lightbox */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
