<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel comments.
 * Komentar pada postingan user yang juga bisa mengandung teks, hashtag, gambar, dan file.
 */
return new class extends Migration
{
    /**
     * Buat tabel comments.
     */
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // pemilik komentar
            $table->foreignId('post_id')->constrained()->onDelete('cascade'); // komentar milik post mana
            $table->text('content');                    // isi komentar (max 250 char)
            $table->json('hashtags')->nullable();       // hashtag dalam komentar
            $table->string('image')->nullable();        // path gambar dalam komentar
            $table->string('file')->nullable();         // path file dalam komentar
            $table->string('file_name')->nullable();    // nama asli file komentar
            $table->timestamps();
        });
    }

    /**
     * Rollback - hapus tabel comments.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
