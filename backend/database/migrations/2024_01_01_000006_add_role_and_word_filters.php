<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom role ke tabel users.
 * Role: 'user' (default) atau 'admin'
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['user', 'admin'])->default('user')->after('avatar');
        });

        // Tabel untuk filter kata yang dilarang
        Schema::create('word_filters', function (Blueprint $table) {
            $table->id();
            $table->string('word')->unique(); // kata yang difilter
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
        Schema::dropIfExists('word_filters');
    }
};
