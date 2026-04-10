<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model User - merepresentasikan pengguna aplikasi.
 * Role: 'user' (biasa) atau 'admin' (super admin dengan dashboard).
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'username', 'email', 'password',
        'bio', 'avatar', 'role',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    /** Relasi: user memiliki banyak postingan */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** Relasi: user memiliki banyak komentar */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /** Relasi: notifikasi yang diterima user ini */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /** Relasi: like yang diberikan user ini */
    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /** Accessor: URL lengkap avatar */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? asset('storage/' . $this->avatar) : null;
    }

    /** Cek apakah user adalah admin */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
