<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * NotificationController - Mengelola notifikasi user.
 * Fitur: lihat notifikasi, tandai sudah dibaca, hapus notifikasi.
 */
class NotificationController extends Controller
{
    /**
     * Ambil semua notifikasi untuk user yang sedang login.
     * Diurutkan dari yang terbaru.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->with('actor:id,name,username,avatar')
            ->latest()
            ->paginate(20);

        $formatted = $notifications->getCollection()->map(function ($notif) {
            return [
                'id'       => $notif->id,
                'type'     => $notif->type,
                'is_read'  => $notif->is_read,
                'actor'    => $notif->actor ? [
                    'id'         => $notif->actor->id,
                    'name'       => $notif->actor->name,
                    'username'   => $notif->actor->username,
                    'avatar_url' => $notif->actor->avatar_url,
                ] : null,
                'notifiable_type' => $notif->notifiable_type,
                'notifiable_id'   => $notif->notifiable_id,
                'created_at'      => $notif->created_at,
            ];
        });

        return response()->json([
            'notifications'  => $formatted,
            'unread_count'   => $request->user()->notifications()->where('is_read', false)->count(),
            'current_page'   => $notifications->currentPage(),
            'last_page'      => $notifications->lastPage(),
        ]);
    }

    /**
     * Jumlah notifikasi yang belum dibaca (untuk badge di navbar).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->notifications()->where('is_read', false)->count(),
        ]);
    }

    /**
     * Tandai semua notifikasi sebagai sudah dibaca.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Semua notifikasi ditandai dibaca']);
    }

    /**
     * Tandai satu notifikasi sebagai sudah dibaca.
     *
     * @param Request $request
     * @param int $id - ID notifikasi
     * @return JsonResponse
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $notif = $request->user()->notifications()->findOrFail($id);
        $notif->update(['is_read' => true]);

        return response()->json(['message' => 'Notifikasi ditandai dibaca']);
    }
}
