<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('reviews')) {
            return;
        }

        Schema::table('reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('reviews', 'product_id')) {
                $table->unsignedBigInteger('product_id')->nullable()->after('order_id');
            }
        });

        $this->dropOrderIdUniqueIfExists();
        $this->createOrderIdProductIdUniqueIfNotExists();

        $hasProductIdFk = false;
        foreach ($this->getForeignKeys('reviews') as $fk) {
            if ($fk['column'] === 'product_id') {
                $hasProductIdFk = true;
                break;
            }
        }

        if (!$hasProductIdFk) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('reviews')) {
            return;
        }

        $foreignKeys = $this->getForeignKeys('reviews');

        foreach ($foreignKeys as $fk) {
            if ($fk['column'] === 'product_id') {
                Schema::table('reviews', function (Blueprint $table) use ($fk) {
                    $table->dropForeign($fk['name']);
                });
                break;
            }
        }

        $this->dropOrderIdProductIdUniqueIfExists();

        $hasSimpleOrderIdUnique = false;
        $uniqueIndexes = $this->getUniqueIndexes('reviews');
        foreach ($uniqueIndexes as $index) {
            if (count($index['columns']) === 1 && $index['columns'][0] === 'order_id') {
                $hasSimpleOrderIdUnique = true;
                break;
            }
        }

        if (!$hasSimpleOrderIdUnique) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->unique('order_id');
            });
        }

        if (Schema::hasColumn('reviews', 'product_id')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropColumn('product_id');
            });
        }
    }

    private function dropOrderIdUniqueIfExists(): void
    {
        $uniqueIndexes = $this->getUniqueIndexes('reviews');
        foreach ($uniqueIndexes as $index) {
            if (count($index['columns']) === 1 && $index['columns'][0] === 'order_id') {
                Schema::table('reviews', function (Blueprint $table) use ($index) {
                    $table->dropUnique($index['name']);
                });
                break;
            }
        }
    }

    private function createOrderIdProductIdUniqueIfNotExists(): void
    {
        $uniqueIndexes = $this->getUniqueIndexes('reviews');
        $hasCompoundUnique = false;
        foreach ($uniqueIndexes as $index) {
            if (count($index['columns']) === 2 && in_array('order_id', $index['columns']) && in_array('product_id', $index['columns'])) {
                $hasCompoundUnique = true;
                break;
            }
        }

        if (!$hasCompoundUnique) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->unique(['order_id', 'product_id'], 'reviews_order_id_product_id_unique');
            });
        }
    }

    private function dropOrderIdProductIdUniqueIfExists(): void
    {
        $uniqueIndexes = $this->getUniqueIndexes('reviews');
        foreach ($uniqueIndexes as $index) {
            if (count($index['columns']) === 2 && in_array('order_id', $index['columns']) && in_array('product_id', $index['columns'])) {
                Schema::table('reviews', function (Blueprint $table) use ($index) {
                    $table->dropUnique($index['name']);
                });
                break;
            }
        }
    }

    private function getUniqueIndexes(string $table): array
    {
        $driver = Schema::getConnection()->getDriverName();
        $connection = Schema::getConnection();

        if ($driver === 'pgsql') {
            $rows = $connection->select("
                SELECT tc.constraint_name AS \"name\", kcu.column_name AS \"column\"
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = 'public'
                    AND tc.table_name = ?
                    AND tc.constraint_type = 'UNIQUE'
                ORDER BY tc.constraint_name, kcu.ordinal_position
            ", [$table]);

            $indexes = [];
            foreach ($rows as $row) {
                $indexes[$row->name]['name'] = $row->name;
                $indexes[$row->name]['columns'][] = $row->column;
            }
            return array_values($indexes);
        }

        if ($driver === 'pgsql') {
            $rows = $connection->select("
                SELECT tc.constraint_name AS \"name\", kcu.column_name AS \"column\"
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = 'public'
                    AND tc.table_name = ?
                    AND tc.constraint_type = 'UNIQUE'
                ORDER BY tc.constraint_name, kcu.ordinal_position
            ", [$table]);
        } else {
            $rows = $connection->select('SHOW INDEX FROM `reviews` WHERE Key_name != ?', ['PRIMARY']);
        }

        $indexes = [];
        if ($driver === 'pgsql') {
            foreach ($rows as $row) {
                $indexes[$row->name]['name'] = $row->name;
                $indexes[$row->name]['columns'][] = $row->column;
            }
        } else {
            foreach ($rows as $row) {
                $name = $row->Key_name;
                $column = $row->Column_name;
                $nonUnique = (int) $row->Non_unique === 0;
                if ($nonUnique) {
                    $indexes[$name]['name'] = $name;
                    $indexes[$name]['columns'][] = $column;
                }
            }
        }
        return array_values($indexes);
    }

    private function getForeignKeys(string $table): array
    {
        $driver = Schema::getConnection()->getDriverName();
        $connection = Schema::getConnection();

        if ($driver === 'pgsql') {
            $rows = $connection->select("
                SELECT tc.constraint_name AS \"name\", kcu.column_name AS \"column\"
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = 'public'
                    AND tc.table_name = ?
                    AND tc.constraint_type = 'FOREIGN KEY'
                ORDER BY tc.constraint_name, kcu.ordinal_position
            ", [$table]);
        } else {
            $rows = $connection->select("
                SELECT constraint_name AS \"name\", column_name AS \"column\"
                FROM information_schema.key_column_usage
                WHERE table_schema = DATABASE()
                    AND table_name = ?
                    AND referenced_table_name IS NOT NULL
                ORDER BY constraint_name, ordinal_position
            ", [$table]);
        }

        $foreignKeys = [];
        foreach ($rows as $row) {
            $foreignKeys[] = ['name' => $row->name, 'column' => $row->column];
        }
        return $foreignKeys;
    }
};
