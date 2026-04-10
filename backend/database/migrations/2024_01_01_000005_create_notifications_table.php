<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel notifications.
 * Menyimpan notifikasi untuk user (like pada post/komentar miliknya).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');   // penerima notif
            $table->foreignId('actor_id')->constrained('users')->onDelete('cascade'); // yang melakukan aksi
            $table->string('type');          // 'post_liked', 'comment_liked'
            $table->morphs('notifiable');    // referensi ke post/comment yang di-like
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
