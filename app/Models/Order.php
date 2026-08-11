<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'delivery_id', 'status', 'guest_email', 'delivery_type', 'delivery_address', 'payment_method', 'payment_status', 'payment_gateway_id', 'pin', 'total_price', 'guest_name', 'guest_phone', 'approved_by', 'rejection_reason', 'tracking_token'];

    public function user(){
        return $this->belongsTo(User::class, 'user_id');
    }

    public function delivery(){
        return $this->belongsTo(User::class, 'delivery_id');
    }

    public function approver(){
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(){
        return $this->hasMany(OrderItem::class);
    }

    public function review(){
        return $this->hasOne(Review::class);
    }
}
