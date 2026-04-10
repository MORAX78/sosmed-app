<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware EnsureIsAdmin - Memastikan request hanya bisa diakses oleh admin.
 * Digunakan pada semua route admin (kecuali login admin).
 */
class EnsureIsAdmin
{
    /**
     * Cek apakah user yang terautentikasi memiliki role admin.
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): mixed
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Hanya admin yang diizinkan.'], 403);
        }

        return $next($request);
    }
}
