<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function store(Request $request, Order $order)
    {
        if ($order->status !== 'delivered') {
            return back()->with('error', 'Solo podés calificar pedidos entregados.');
        }

        $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'food_rating' => 'required|integer|min:1|max:5',
            'delivery_rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $productId = $request->product_id;

        if (!$productId && $order->items->isNotEmpty()) {
            $productId = $order->items->first()->product_id;
        }

        if (!$productId) {
            return back()->with('error', 'No se pudo asignar la reseña a un producto del pedido.');
        }

        $existing = Review::where('order_id', $order->id)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            return back()->with('error', 'Ya calificaste este producto en este pedido.');
        }

        Review::create([
            'order_id' => $order->id,
            'user_id' => Auth::id(),
            'product_id' => $productId,
            'food_rating' => $request->food_rating,
            'delivery_rating' => $request->delivery_rating,
            'comment' => $request->comment,
        ]);

        return back()->with('success', '¡Gracias por tu reseña!');
    }
}
