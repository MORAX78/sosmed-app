<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model WordFilter - kata-kata yang dilarang dalam postingan/komentar.
 * Dikelola oleh admin melalui dashboard.
 */
class WordFilter extends Model
{
    protected $fillable = ['word'];

    /**
     * Cek apakah suatu teks mengandung kata yang difilter.
     * Mengembalikan daftar kata terlarang yang ditemukan.
     *
     * @param string $text
     * @return array
     */
    public static function checkContent(string $text): array
    {
        $filters  = self::pluck('word')->toArray();
        $found    = [];
        $textLower = strtolower($text);

        foreach ($filters as $word) {
            if (str_contains($textLower, strtolower($word))) {
                $found[] = $word;
            }
        }
        return $found;
    }

    /**
     * Sensor konten dengan mengganti kata terlarang dengan tanda bintang.
     *
     * @param string $text
     * @return string
     */
    public static function censorContent(string $text): string
    {
        $filters = self::pluck('word')->toArray();
        foreach ($filters as $word) {
            $text = preg_replace(
                '/\b' . preg_quote($word, '/') . '\b/iu',
                str_repeat('*', mb_strlen($word)),
                $text
            );
        }
        return $text;
    }
}
