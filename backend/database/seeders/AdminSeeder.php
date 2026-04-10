<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * AdminSeeder - Membuat akun super admin default.
 * Jalankan dengan: php artisan db:seed --class=AdminSeeder
 *
 * Default credentials:
 *   Email:    admin@sosmed.com
 *   Password: admin123
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@sosmed.com'],
            [
                'name'     => 'Super Admin',
                'username' => 'superadmin',
                'email'    => 'admin@sosmed.com',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
                'bio'      => 'Administrator SosMedia',
            ]
        );

        $this->command->info('Admin created: admin@sosmed.com / admin123');
    }
}
