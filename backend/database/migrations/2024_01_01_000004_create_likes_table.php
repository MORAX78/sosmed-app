<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel likes.
 * Menyimpan like pada postingan maupun komentar dalam satu tabel (polymorphic).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('likeable'); // likeable_type (App\Models\Post / Comment) + likeable_id
            $table->timestamps();

            // Satu user hanya bisa like satu kali per item
            $table->unique(['user_id', 'likeable_type', 'likeable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
