<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk tabel users.
 * Menambahkan kolom bio dan avatar ke tabel users bawaan Laravel.
 */
return new class extends Migration
{
    /**
     * Jalankan migration - buat/modifikasi tabel users.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique(); // username unik untuk setiap user
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->text('bio')->nullable();            // bio/deskripsi profil user
            $table->string('avatar')->nullable();       // path foto profil
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Rollback migration - hapus tabel users.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
