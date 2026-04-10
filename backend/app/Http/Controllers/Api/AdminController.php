<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Models\WordFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * AdminController - Endpoint khusus untuk super admin.
 * Semua route di sini dilindungi middleware admin.
 * Fitur: statistik, kelola user, kelola filter kata.
 */
class AdminController extends Controller
{
    /**
     * Statistik ringkasan untuk dashboard admin.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users'    => User::where('role', 'user')->count(),
            'total_posts'    => Post::count(),
            'total_comments' => Comment::count(),
            'total_filters'  => WordFilter::count(),
            'recent_users'   => User::where('role', 'user')
                ->latest()->take(5)
                ->get(['id','name','username','email','created_at']),
        ]);
    }

    /**
     * Daftar semua user (non-admin) dengan pagination dan search.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::where('role', 'user')
            ->withCount(['posts', 'comments']);

        // Search berdasarkan nama, username, atau email
        if ($request->search) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")
                   ->orWhere('username', 'like', "%$q%")
                   ->orWhere('email', 'like', "%$q%");
            });
        }

        $users = $query->latest()->paginate(15);

        $formatted = $users->getCollection()->map(fn($u) => [
            'id'             => $u->id,
            'name'           => $u->name,
            'username'       => $u->username,
            'email'          => $u->email,
            'avatar_url'     => $u->avatar_url,
            'posts_count'    => $u->posts_count,
            'comments_count' => $u->comments_count,
            'created_at'     => $u->created_at,
        ]);

        return response()->json([
            'users'        => $formatted,
            'current_page' => $users->currentPage(),
            'last_page'    => $users->lastPage(),
            'total'        => $users->total(),
        ]);
    }

    /**
     * Hapus user beserta semua kontennya.
     *
     * @param int $id - ID user yang dihapus
     * @return JsonResponse
     */
    public function deleteUser(int $id): JsonResponse
    {
        $user = User::where('role', 'user')->findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus']);
    }

    /**
     * Daftar semua postingan dengan pagination dan search.
     * Admin bisa melihat dan menghapus postingan.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function posts(Request $request): JsonResponse
    {
        $query = Post::with('user:id,name,username')
            ->withCount('comments', 'likes')
            ->latest();

        if ($request->search) {
            $query->where('content', 'like', "%{$request->search}%");
        }

        $posts = $query->paginate(15);

        return response()->json([
            'posts'        => $posts->getCollection()->map(fn($p) => [
                'id'             => $p->id,
                'content'        => $p->content,
                'hashtags'       => $p->hashtags ?? [],
                'image_url'      => $p->image_url,
                'comments_count' => $p->comments_count,
                'likes_count'    => $p->likes_count,
                'created_at'     => $p->created_at,
                'user'           => $p->user,
            ]),
            'current_page' => $posts->currentPage(),
            'last_page'    => $posts->lastPage(),
            'total'        => $posts->total(),
        ]);
    }

    /**
     * Hapus postingan (oleh admin).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function deletePost(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $post->delete();

        return response()->json(['message' => 'Postingan berhasil dihapus']);
    }

    /**
     * Daftar semua komentar dengan search.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function comments(Request $request): JsonResponse
    {
        $query = Comment::with('user:id,name,username', 'post:id,content')
            ->withCount('likes')
            ->latest();

        if ($request->search) {
            $query->where('content', 'like', "%{$request->search}%");
        }

        $comments = $query->paginate(15);

        return response()->json([
            'comments'     => $comments->getCollection()->map(fn($c) => [
                'id'          => $c->id,
                'content'     => $c->content,
                'hashtags'    => $c->hashtags ?? [],
                'likes_count' => $c->likes_count,
                'created_at'  => $c->created_at,
                'user'        => $c->user,
                'post'        => $c->post ? ['id' => $c->post->id, 'content' => substr($c->post->content, 0, 60)] : null,
            ]),
            'current_page' => $comments->currentPage(),
            'last_page'    => $comments->lastPage(),
            'total'        => $comments->total(),
        ]);
    }

    /**
     * Hapus komentar (oleh admin).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function deleteComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Komentar berhasil dihapus']);
    }

    // ─────────────────────────────────────────────
    // WORD FILTER MANAGEMENT
    // ─────────────────────────────────────────────

    /**
     * Daftar semua kata yang difilter.
     *
     * @return JsonResponse
     */
    public function wordFilters(): JsonResponse
    {
        return response()->json([
            'filters' => WordFilter::orderBy('word')->get(),
        ]);
    }

    /**
     * Tambah kata filter baru.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function addWordFilter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'word' => 'required|string|max:100|unique:word_filters,word',
        ]);

        $filter = WordFilter::create(['word' => strtolower(trim($validated['word']))]);

        return response()->json([
            'message' => 'Kata filter ditambahkan',
            'filter'  => $filter,
        ], 201);
    }

    /**
     * Hapus kata filter.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function deleteWordFilter(int $id): JsonResponse
    {
        WordFilter::findOrFail($id)->delete();

        return response()->json(['message' => 'Kata filter dihapus']);
    }

    /**
     * Login khusus admin (menggunakan endpoint terpisah).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->where('role', 'admin')
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Kredensial admin tidak valid'], 401);
        }

        // Hapus token lama dan buat yang baru
        $user->tokens()->delete();
        $token = $user->createToken('admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Login admin berhasil',
            'admin'   => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role'     => $user->role,
            ],
            'token' => $token,
        ]);
    }
}
