<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Controller untuk manajemen profil user.
 * Menangani update bio, foto profil, dan melihat profil user lain.
 */
class UserController extends Controller
{
    /**
     * Update profil user yang sedang login.
     * Bisa mengupdate nama, bio, dan foto profil.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        // Validasi input update profil
        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'bio'    => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        // Jika ada file avatar baru yang diupload
        if ($request->hasFile('avatar')) {
            // Hapus avatar lama jika ada
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            // Simpan avatar baru ke storage/public/avatars/
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $avatarPath;
        }

        // Update data user dengan data yang sudah divalidasi
        $user->update($validated);

        return response()->json([
            'message' => 'Profil berhasil diupdate',
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'username'   => $user->username,
                'email'      => $user->email,
                'bio'        => $user->bio,
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }

    /**
     * Menampilkan profil user berdasarkan username.
     * Bisa diakses publik (untuk melihat profil user lain).
     *
     * @param string $username
     * @return JsonResponse
     */
    public function show(string $username): JsonResponse
    {
        // Cari user berdasarkan username, eager load posts-nya
        $user = \App\Models\User::where('username', $username)
            ->withCount('posts', 'comments')
            ->firstOrFail();

        return response()->json([
            'user' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'username'      => $user->username,
                'bio'           => $user->bio,
                'avatar_url'    => $user->avatar_url,
                'posts_count'   => $user->posts_count,
                'comments_count'=> $user->comments_count,
                'created_at'    => $user->created_at,
            ],
        ]);
    }
}
