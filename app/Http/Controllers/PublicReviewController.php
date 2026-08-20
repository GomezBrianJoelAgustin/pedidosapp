<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class PublicReviewController extends Controller
{
    public function store(Request $request, Order $order)
    {
        if ($order->status !== 'delivered') {
            return back()->with('error', 'Solo podés calificar pedidos entregados.');
        }

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'food_rating' => 'required|integer|min:1|max:5',
            'delivery_rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $existing = Review::where('order_id', $order->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($existing) {
            return back()->with('error', 'Ya calificaste este producto en este pedido.');
        }

        Review::create([
            'order_id' => $order->id,
            'product_id' => $request->product_id,
            'food_rating' => $request->food_rating,
            'delivery_rating' => $request->delivery_rating,
            'comment' => $request->comment,
        ]);

        return back()->with('success', '¡Gracias por tu reseña!');
    }
}
