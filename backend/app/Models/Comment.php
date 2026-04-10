<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Model Comment - merepresentasikan komentar pada postingan.
 */
class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['user_id','post_id','content','hashtags','image','file','file_name'];
    protected $casts    = ['hashtags' => 'array'];

    public function user(): BelongsTo   { return $this->belongsTo(User::class); }
    public function post(): BelongsTo   { return $this->belongsTo(Post::class); }
    public function likes(): MorphMany  { return $this->morphMany(Like::class,'likeable'); }
    public function notifications(): MorphMany { return $this->morphMany(Notification::class,'notifiable'); }

    public function getImageUrlAttribute(): ?string { return $this->image ? asset('storage/'.$this->image) : null; }
    public function getFileUrlAttribute(): ?string  { return $this->file  ? asset('storage/'.$this->file)  : null; }

    public function scopeWithHashtag($query, string $hashtag)
    {
        return $query->whereJsonContains('hashtags', strtolower($hashtag));
    }
}
