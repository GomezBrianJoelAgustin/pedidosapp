<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view products', 'create products', 'edit products', 'delete products',
            'view orders', 'create orders', 'edit orders', 'delete orders',
            'update order status', 'cancel order', 'view my orders',
            'view users', 'create users', 'edit users', 'delete users',
            'open box', 'close box',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier']);
        $chefRole = Role::firstOrCreate(['name' => 'chef']);
        $deliveryRole = Role::firstOrCreate(['name' => 'delivery']);
        $clienteRole = Role::firstOrCreate(['name' => 'client']);

        $superAdminRole->syncPermissions(Permission::all());

        $adminRole->syncPermissions([
            'view products', 'create products', 'edit products', 'delete products',
            'view orders', 'create orders', 'edit orders', 'delete orders',
            'update order status', 'view users', 'create users', 'edit users', 'delete users',
        ]);

        $cashierRole->syncPermissions([
            'create orders', 'edit orders', 'delete orders', 'update order status',
        ]);

        $chefRole->syncPermissions([
            'view orders', 'update order status',
        ]);

        $deliveryRole->syncPermissions([
            'view orders', 'update order status',
        ]);

        $clienteRole->syncPermissions([
            'create orders', 'view my orders', 'cancel order',
            'edit users', 'edit orders', 'view products',
        ]);
    }
}