<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\WordFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * CommentController - CRUD komentar dengan sensor kata, likes, dan filter hashtag.
 * Bug fix: route update/delete komentar kini menggunakan comment ID langsung (bukan nested).
 */
class CommentController extends Controller
{
    /**
     * Daftar komentar untuk postingan tertentu.
     */
    public function index(Request $request, Post $post): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Comment::where('post_id', $post->id)
            ->with('user:id,name,username,avatar')
            ->withCount('likes')
            ->latest();

        if ($request->filled('hashtag')) {
            $query->withHashtag($request->hashtag);
        }

        $comments = $query->get();

        return response()->json([
            'comments' => $comments->map(fn($c) => $this->formatComment($c, $userId)),
        ]);
    }

    /**
     * Buat komentar baru. Konten disensor.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|max:10240',
        ]);

        $content  = WordFilter::censorContent($validated['content']);
        $hashtags = $this->extractHashtags($content);

        $imagePath = $filePath = $fileName = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('comments/images', 'public');
        }
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('comments/files', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        $comment = Comment::create([
            'user_id'   => $request->user()->id,
            'post_id'   => $post->id,
            'content'   => $content,
            'hashtags'  => $hashtags,
            'image'     => $imagePath,
            'file'      => $filePath,
            'file_name' => $fileName,
        ]);

        $comment->load('user:id,name,username,avatar');
        $comment->loadCount('likes');

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan',
            'comment' => $this->formatComment($comment, $request->user()->id),
        ], 201);
    }

    /**
     * Update komentar.
     * BUG FIX: Menggunakan Comment model binding langsung (bukan nested di post).
     * Otorisasi dicek manual berdasarkan user_id.
     */
    public function update(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:250',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'file'    => 'nullable|file|max:10240',
        ]);

        $content  = WordFilter::censorContent($validated['content']);
        $hashtags = $this->extractHashtags($content);

        $imagePath = $comment->image;
        $filePath  = $comment->file;
        $fileName  = $comment->file_name;

        if ($request->hasFile('image')) {
            if ($comment->image) Storage::disk('public')->delete($comment->image);
            $imagePath = $request->file('image')->store('comments/images', 'public');
        }
        if ($request->hasFile('file')) {
            if ($comment->file) Storage::disk('public')->delete($comment->file);
            $filePath = $request->file('file')->store('comments/files', 'public');
            $fileName = $request->file('file')->getClientOriginalName();
        }

        $comment->update([
            'content'   => $content,
            'hashtags'  => $hashtags,
            'image'     => $imagePath,
            'file'      => $filePath,
            'file_name' => $fileName,
        ]);

        $comment->load('user:id,name,username,avatar');
        $comment->loadCount('likes');

        return response()->json([
            'message' => 'Komentar berhasil diupdate',
            'comment' => $this->formatComment($comment, $request->user()->id),
        ]);
    }

    /**
     * Hapus komentar.
     * BUG FIX: Menggunakan Comment model binding langsung.
     */
    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        if ($comment->image) Storage::disk('public')->delete($comment->image);
        if ($comment->file)  Storage::disk('public')->delete($comment->file);
        $comment->delete();

        return response()->json(['message' => 'Komentar berhasil dihapus']);
    }

    /** Ekstrak hashtag dari teks */
    private function extractHashtags(string $content): array
    {
        preg_match_all('/#(\w+)/', $content, $matches);
        return array_values(array_unique(array_map('strtolower', $matches[1])));
    }

    /** Format komentar untuk response JSON */
    private function formatComment(Comment $comment, int $userId): array
    {
        $liked = $comment->relationLoaded('likes')
            ? $comment->likes->contains('user_id', $userId)
            : $comment->likes()->where('user_id', $userId)->exists();

        return [
            'id'          => $comment->id,
            'post_id'     => $comment->post_id,
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
