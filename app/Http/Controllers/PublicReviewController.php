<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class PublicReviewController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $request->validate([
            'food_rating' => 'required|integer|min:1|max:5',
            'delivery_rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($order->review) {
            return back()->with('error', 'Ya has enviado una reseña para este pedido.');
        }

        $order->review()->create([
            'food_rating' => $request->food_rating,
            'delivery_rating' => $request->delivery_rating,
            'comment' => $request->comment,
        ]);

        return back()->with('success', '¡Gracias por tu reseña!');
    }
}
