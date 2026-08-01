<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'delivery_id', 'status', 'delivery_type', 'delivery_address', 'payment_method', 'payment_status', 'payment_gateway_id', 'total_price', 'guest_name', 'guest_phone'];

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }

    public function delivery(){
        return $this->belongsTo(User::class, 'delivery_id');
    }

    public function items(){
        return $this->hasMany(OrderItem::class);
    }
}
