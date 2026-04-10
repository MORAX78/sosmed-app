<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Controller untuk autentikasi user.
 * Menangani proses register, login, logout, dan mendapatkan data user yang sedang login.
 */
class AuthController extends Controller
{
    /**
     * Registrasi user baru.
     * Validasi input, buat user, lalu kembalikan token autentikasi.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        // Validasi data input dari request
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users|alpha_dash',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
        ]);

        // Buat user baru dengan data yang sudah divalidasi
        $user = User::create([
            'name'     => $validated['name'],
            'username' => $validated['username'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Buat token Sanctum untuk user baru
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    /**
     * Login user dengan email dan password.
     * Jika berhasil, kembalikan data user dan token autentikasi.
     *
     * @param Request $request
     * @return JsonResponse
     * @throws ValidationException jika kredensial salah
     */
    public function login(Request $request): JsonResponse
    {
        // Validasi input login
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Cek apakah kredensial valid
        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Ambil user yang berhasil login
        $user = User::where('email', $request->email)->firstOrFail();

        // Hapus token lama dan buat yang baru
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ]);
    }

    /**
     * Logout user - hapus semua token aktif user tersebut.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Hapus semua token milik user yang sedang login
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }

    /**
     * Mendapatkan data user yang sedang login (berdasarkan token).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Helper: format data user untuk response JSON.
     * Menyertakan avatar_url yang sudah di-generate.
     *
     * @param User $user
     * @return array
     */
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'username'   => $user->username,
            'email'      => $user->email,
            'bio'        => $user->bio,
            'avatar_url' => $user->avatar_url,
            'created_at' => $user->created_at,
        ];
    }
}
