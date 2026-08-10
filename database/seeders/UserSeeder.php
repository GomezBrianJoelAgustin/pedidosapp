<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@empandas.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make(env('ADMIN_DEFAULT_PASSWORD', 'password123')),
                'email_verified_at' => now(),
            ]
        );

        if (! $superAdmin->hasRole('super-admin')) {
            $superAdmin->syncRoles(['super-admin']);
        }

        $chef = User::updateOrCreate(
            ['email' => 'cocina@empandas.com'],
            [
                'name' => 'Chef Cocina',
                'password' => Hash::make(env('USER_DEFAULT_PASSWORD', 'password123')),
                'email_verified_at' => now(),
            ]
        );

        if (! $chef->hasRole('chef')) {
            $chef->syncRoles(['chef']);
        }

        $delivery = User::updateOrCreate(
            ['email' => 'cadete@empandas.com'],
            [
                'name' => 'Cadete Delivery',
                'password' => Hash::make(env('USER_DEFAULT_PASSWORD', 'password123')),
                'email_verified_at' => now(),
            ]
        );

        if (! $delivery->hasRole('delivery')) {
            $delivery->syncRoles(['delivery']);
        }

        $cashier = User::updateOrCreate(
            ['email' => 'caja@empandas.com'],
            [
                'name' => 'Cajero',
                'password' => Hash::make(env('USER_DEFAULT_PASSWORD', 'password123')),
                'email_verified_at' => now(),
            ]
        );

        if (! $cashier->hasRole('cashier')) {
            $cashier->syncRoles(['cashier']);
        }
    }
}