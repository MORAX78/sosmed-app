<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\WordFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * PostController - CRUD postingan dengan dukungan:
 * - Upload gambar & file
 * - Ekstraksi hashtag otomatis
 * - Sensor kata terlarang
 * - Filter berdasarkan hashtag
 * - Likes count & status
 */
class PostController extends Controller
{
    /**
     * Ambil semua postingan, diurutkan terbaru.
     * Filter hashtag opsional via query ?hashtag=...
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Post::with([
                'user:id,name,username,avatar',
                'comments.user:id,name,username,avatar',
                'comments.likes',
            ])
            ->withCount('likes')
            ->latest();

        if ($request->filled('hashtag')) {
            $query->withHashtag($request->hashtag);
        }

        $posts = $query->paginate(10);

        $formatted = $posts->getCollection()->map(fn($p) => $this->formatPost($p, $userId));

        return response()->json([
            'posts'        => $formatted,
            'current_page' => $posts->currentPage(),
            'last_page'    => $posts->lastPage(),
            'total'        => $posts->total(),
        ]);
    }

    /**
     * Buat postingan baru.
     * Konten disensor sebelum disimpan jika mengandung kata terlarang.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|max:10240',
        ]);

        // Sensor kata terlarang dalam konten
        $content  = WordFilter::censorContent($validated['content']);
        $hashtags = $this->extractHashtags($content);

        $imagePath = $filePath = $fileName = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts/images', 'public');
        }
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('posts/files', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        $post = Post::create([
            'user_id'   => $request->user()->id,
            'content'   => $content,
            'hashtags'  => $hashtags,
            'image'     => $imagePath,
            'file'      => $filePath,
            'file_name' => $fileName,
        ]);

        $post->load('user:id,name,username,avatar');
        $post->loadCount('likes');

        return response()->json([
            'message' => 'Postingan berhasil dibuat',
            'post'    => $this->formatPost($post, $request->user()->id),
        ], 201);
    }

    /**
     * Detail satu postingan dengan semua komentar.
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        $post->load([
            'user:id,name,username,avatar',
            'comments.user:id,name,username,avatar',
            'comments.likes',
        ]);
        $post->loadCount('likes');

        return response()->json(['post' => $this->formatPost($post, $request->user()->id)]);
    }

    /**
     * Update postingan. Hanya pemilik yang boleh.
     * Konten baru juga disensor.
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|max:10240',
        ]);

        $content  = WordFilter::censorContent($validated['content']);
        $hashtags = $this->extractHashtags($content);

        $imagePath = $post->image;
        $filePath  = $post->file;
        $fileName  = $post->file_name;

        if ($request->hasFile('image')) {
            if ($post->image) Storage::disk('public')->delete($post->image);
            $imagePath = $request->file('image')->store('posts/images', 'public');
        }
        if ($request->hasFile('file')) {
            if ($post->file) Storage::disk('public')->delete($post->file);
            $filePath = $request->file('file')->store('posts/files', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        $post->update([
            'content'   => $content,
            'hashtags'  => $hashtags,
            'image'     => $imagePath,
            'file'      => $filePath,
            'file_name' => $fileName,
        ]);

        $post->load('user:id,name,username,avatar', 'comments.user:id,name,username,avatar', 'comments.likes');
        $post->loadCount('likes');

        return response()->json([
            'message' => 'Postingan berhasil diupdate',
            'post'    => $this->formatPost($post, $request->user()->id),
        ]);
    }

    /**
     * Hapus postingan beserta file-nya. Hanya pemilik yang boleh.
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        if ($post->image) Storage::disk('public')->delete($post->image);
        if ($post->file)  Storage::disk('public')->delete($post->file);
        $post->delete();

        return response()->json(['message' => 'Postingan berhasil dihapus']);
    }

    /** Ekstrak hashtag dari teks menggunakan regex */
    private function extractHashtags(string $content): array
    {
        preg_match_all('/#(\w+)/', $content, $matches);
        return array_values(array_unique(array_map('strtolower', $matches[1])));
    }

    /**
     * Format data postingan untuk response JSON.
     * Menyertakan status liked oleh current user.
     *
     * @param Post $post
     * @param int  $userId - ID user yang sedang login
     */
    private function formatPost(Post $post, int $userId): array
    {
        $liked = $post->relationLoaded('likes')
            ? $post->likes->contains('user_id', $userId)
            : $post->likes()->where('user_id', $userId)->exists();

        return [
            'id'             => $post->id,
            'content'        => $post->content,
            'hashtags'       => $post->hashtags ?? [],
            'image_url'      => $post->image_url,
            'file_url'       => $post->file_url,
            'file_name'      => $post->file_name,
            'created_at'     => $post->created_at,
            'updated_at'     => $post->updated_at,
            'likes_count'    => $post->likes_count ?? $post->likes()->count(),
            'liked_by_me'    => $liked,
            'user'           => $post->user ? [
                'id'         => $post->user->id,
                'name'       => $post->user->name,
                'username'   => $post->user->username,
                'avatar_url' => $post->user->avatar_url,
            ] : null,
            'comments'       => $post->relationLoaded('comments')
                ? $post->comments->map(fn($c) => $this->formatComment($c, $userId))
                : [],
            'comments_count' => $post->relationLoaded('comments')
                ? $post->comments->count()
                : 0,
        ];
    }

    /** Format data komentar untuk response */
    private function formatComment(\App\Models\Comment $comment, int $userId): array
    {
        $liked = $comment->relationLoaded('likes')
            ? $comment->likes->contains('user_id', $userId)
            : $comment->likes()->where('user_id', $userId)->exists();

        return [
            'id'          => $comment->id,
            'content'     => $comment->content,
            'hashtags'    => $comment->hashtags ?? [],
            'image_url'   => $comment->image_url,
            'file_url'    => $comment->file_url,
            'file_name'   => $comment->file_name,
            'created_at'  => $comment->created_at,
            'updated_at'  => $comment->updated_at,
            'likes_count' => $comment->likes_count ?? $comment->likes()->count(),
            'liked_by_me' => $liked,
            'user'        => $comment->user ? [
                'id'         => $comment->user->id,
                'name'       => $comment->user->name,
                'username'   => $comment->user->username,
                'avatar_url' => $comment->user->avatar_url,
            ] : null,
        ];
    }
}
