<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Model Like - merepresentasikan like pada postingan atau komentar.
 * Menggunakan polymorphic relation agar bisa dipakai untuk Post dan Comment.
 */
class Like extends Model
{
    protected $fillable = ['user_id', 'likeable_type', 'likeable_id'];

    /**
     * Relasi polymorphic: like bisa dimiliki Post atau Comment.
     */
    public function likeable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * User yang memberikan like.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
