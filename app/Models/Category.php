<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'active'];

    public static function getActiveWithActiveProducts()
    {
        return static::where('active', true)
            ->with(['products' => function ($query) {
                $query->where('active', true);
            }])
            ->get();
    }

    public function products(){
        return $this->hasMany(Product::class);
    }
}
