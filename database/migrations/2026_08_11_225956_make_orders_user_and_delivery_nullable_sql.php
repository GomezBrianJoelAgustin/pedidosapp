<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // The column modification is handled via raw SQL below
            // because altering foreignId columns requires doctrine/dbal.
        });

        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_foreign');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_id_foreign');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN delivery_id DROP NOT NULL');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_delivery_id_foreign FOREIGN KEY (delivery_id) REFERENCES users(id) ON DELETE CASCADE');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Reverting nullable to not null may fail if existing rows contain nulls.
        });
    }
};
