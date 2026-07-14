<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::create(['name' => 'view products']);
        Permission::create(['name' => 'create products']);
        Permission::create(['name' => 'edit products']);
        Permission::create(['name' => 'delete products']);

        Permission::create(['name' => 'view orders']);
        Permission::create(['name' => 'create orders']);
        Permission::create(['name' => 'edit orders']);
        Permission::create(['name' => 'delete orders']);
        Permission::create(['name' => 'update order status']);
        Permission::create(['name' => 'cancel order']);
        Permission::create(['name' => 'view my orders']);

        Permission::create(['name' => 'view users']);
        Permission::create(['name' => 'create users']);
        Permission::create(['name' => 'edit users']);
        Permission::create(['name' => 'delete users']);

        Permission::create(['name' => 'open box']);
        Permission::create(['name' => 'close box']);

        $superAdminRole = Role::create(['name' => 'super-admin']);
        $adminRole = Role::create(['name' => 'admin']);
        $cashierRole = Role::create(['name' => 'cashier']);
        $chefRole = Role::create(['name' => 'chef']);
        $deliveryRole = Role::create(['name' => 'delivery']);
        $clienteRole = Role::create(['name' => 'client']);

        $superAdminRole->givePermissionTo(Permission::all());
        $adminRole->givePermissionTo([
            'view products',
            'create products',
            'edit products',
            'delete products',
            'view orders',
            'create orders',
            'edit orders',
            'delete orders',
            'update order status',
            'view users',
            'create users',
            'edit users',
            'delete users',
        ]);
        $cashierRole->givePermissionTo([
            'create orders',
            'edit orders',
            'delete orders',
            'update order status',
        ]);
        $chefRole->givePermissionTo([
            'view orders',
            'update order status',
        ]);
        $deliveryRole->givePermissionTo([
            'view orders',
            'update order status',
        ]);
        $clienteRole->givePermissionTo([
            'create orders',
            'view my orders',
            'cancel order',
            'edit users',
            'edit orders',
            'view products'
        ]);
    }
}
