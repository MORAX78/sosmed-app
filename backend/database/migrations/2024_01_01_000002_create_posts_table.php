<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel posts.
 * Postingan user yang berisi text, hashtag, gambar, dan file.
 */
return new class extends Migration
{
    /**
     * Buat tabel posts beserta kolom-kolomnya.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // relasi ke user, hapus post jika user dihapus
            $table->text('content');                    // konten teks postingan (max 250 char, divalidasi di model/controller)
            $table->json('hashtags')->nullable();       // array hashtag dalam format JSON
            $table->string('image')->nullable();        // path gambar yang diupload
            $table->string('file')->nullable();         // path file yang diupload
            $table->string('file_name')->nullable();    // nama asli file (untuk tampilan)
            $table->timestamps();
        });
    }

    /**
     * Hapus tabel posts saat rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
