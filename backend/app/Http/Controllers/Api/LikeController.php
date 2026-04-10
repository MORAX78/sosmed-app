<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Notification;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * LikeController - Toggle like pada postingan atau komentar.
 * Jika belum di-like, tambahkan like dan buat notifikasi.
 * Jika sudah di-like, hapus like dan hapus notifikasi terkait.
 */
class LikeController extends Controller
{
    /**
     * Toggle like pada postingan.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function togglePostLike(Request $request, Post $post): JsonResponse
    {
        return $this->toggleLike($request->user(), $post);
    }

    /**
     * Toggle like pada komentar.
     *
     * @param Request $request
     * @param Comment $comment
     * @return JsonResponse
     */
    public function toggleCommentLike(Request $request, Comment $comment): JsonResponse
    {
        return $this->toggleLike($request->user(), $comment);
    }

    /**
     * Logika toggle like yang digunakan untuk post maupun comment.
     * Menggunakan polymorphic agar bisa dipakai kembali.
     *
     * @param \App\Models\User $user  - User yang melakukan like
     * @param Post|Comment $item      - Item yang di-like
     * @return JsonResponse
     */
    private function toggleLike($user, $item): JsonResponse
    {
        $type = get_class($item);

        // Cek apakah user sudah pernah like item ini
        $existing = Like::where('user_id', $user->id)
            ->where('likeable_type', $type)
            ->where('likeable_id', $item->id)
            ->first();

        if ($existing) {
            // Sudah like → unlike (hapus like dan notifikasi)
            $existing->delete();

            // Hapus notifikasi terkait
            Notification::where('actor_id', $user->id)
                ->where('notifiable_type', $type)
                ->where('notifiable_id', $item->id)
                ->delete();

            return response()->json([
                'liked'      => false,
                'likes_count'=> $item->likes()->count(),
            ]);
        } else {
            // Belum like → buat like baru
            Like::create([
                'user_id'       => $user->id,
                'likeable_type' => $type,
                'likeable_id'   => $item->id,
            ]);

            // Buat notifikasi untuk pemilik item (kecuali jika like milik sendiri)
            $ownerId = $item->user_id;
            if ($ownerId !== $user->id) {
                $notifType = ($type === Post::class) ? 'post_liked' : 'comment_liked';
                Notification::create([
                    'user_id'         => $ownerId,
                    'actor_id'        => $user->id,
                    'type'            => $notifType,
                    'notifiable_type' => $type,
                    'notifiable_id'   => $item->id,
                ]);
            }

            return response()->json([
                'liked'      => true,
                'likes_count'=> $item->likes()->count(),
            ]);
        }
    }
}
