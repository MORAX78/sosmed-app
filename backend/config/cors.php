<?php

/**
 * Konfigurasi CORS (Cross-Origin Resource Sharing).
 * Mengizinkan frontend React (localhost:5173) untuk mengakses API Laravel.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Izinkan request dari URL frontend (React dev server)
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Penting: true agar cookie/token bisa dikirim dari browser
    'supports_credentials' => true,

];
