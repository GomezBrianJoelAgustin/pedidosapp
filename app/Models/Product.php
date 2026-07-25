<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'description', 'image', 'avaliable', 'price', 'category_id', 'active'];

    public function category(){
        return $this->belongsTo(Category::class);
    }
}
