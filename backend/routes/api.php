<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SosMedia Application
|--------------------------------------------------------------------------
*/

// ─── PUBLIK ───────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::get('/users/{username}', [UserController::class, 'show']);

// ─── ADMIN LOGIN (publik, tapi validasi role admin) ───────
Route::post('/admin/login', [AdminController::class, 'login']);

// ─── PRIVATE (butuh token user biasa) ─────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Profil
    Route::post('/profile/update', [UserController::class, 'updateProfile']);

    // Posts
    Route::get('/posts',           [PostController::class, 'index']);
    Route::post('/posts',          [PostController::class, 'store']);
    Route::get('/posts/{post}',    [PostController::class, 'show']);
    Route::post('/posts/{post}/update',  [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Comments - BUG FIX: update & delete menggunakan comment ID langsung
    Route::get('/posts/{post}/comments',     [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments',    [CommentController::class, 'store']);
    Route::post('/comments/{comment}/update',   [CommentController::class, 'update']);
    Route::delete('/comments/{comment}',        [CommentController::class, 'destroy']);

    // Likes
    Route::post('/posts/{post}/like',        [LikeController::class, 'togglePostLike']);
    Route::post('/comments/{comment}/like',  [LikeController::class, 'toggleCommentLike']);

    // Notifikasi
    Route::get('/notifications',             [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',[NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});

// ─── ADMIN PRIVATE (butuh token + role admin) ─────────────
Route::middleware(['auth:sanctum', \App\Http\Middleware\EnsureIsAdmin::class])
    ->prefix('admin')
    ->group(function () {
        Route::get('/stats',    [AdminController::class, 'stats']);

        // Kelola User
        Route::get('/users',           [AdminController::class, 'users']);
        Route::delete('/users/{id}',   [AdminController::class, 'deleteUser']);

        // Kelola Post
        Route::get('/posts',           [AdminController::class, 'posts']);
        Route::delete('/posts/{id}',   [AdminController::class, 'deletePost']);

        // Kelola Komentar
        Route::get('/comments',        [AdminController::class, 'comments']);
        Route::delete('/comments/{id}',[AdminController::class, 'deleteComment']);

        // Word Filter
        Route::get('/word-filters',          [AdminController::class, 'wordFilters']);
        Route::post('/word-filters',         [AdminController::class, 'addWordFilter']);
        Route::delete('/word-filters/{id}',  [AdminController::class, 'deleteWordFilter']);
    });
