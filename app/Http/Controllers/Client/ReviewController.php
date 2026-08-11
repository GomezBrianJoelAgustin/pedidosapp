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
        $request->validate([
            'food_rating' => 'required|integer|min:1|max:5',
            'delivery_rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $order->review()->create([
            'user_id' => Auth::id(),
            'food_rating' => $request->food_rating,
            'delivery_rating' => $request->delivery_rating,
            'comment' => $request->comment,
        ]);

        return back()->with('success', '¡Gracias por tu reseña!');
    }
}
