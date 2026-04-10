<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Model Notification - notifikasi untuk user.
 * Dibuat saat ada like pada postingan/komentar milik user tersebut.
 */
class Notification extends Model
{
    protected $fillable = [
        'user_id', 'actor_id', 'type',
        'notifiable_type', 'notifiable_id', 'is_read',
    ];

    protected $casts = ['is_read' => 'boolean'];

    /** Penerima notifikasi */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** User yang melakukan aksi (yang nge-like) */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /** Item yang dilike (Post atau Comment) */
    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }
}
