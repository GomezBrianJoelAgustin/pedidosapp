<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class PublicTrackingController extends Controller
{
    public function show(Request $request, $token)
    {
        $order = Order::where('tracking_token', $token)
            ->with('items.product', 'user', 'delivery')
            ->firstOrFail();

        $order->makeHidden('tracking_token');
        $order->makeVisible(['pin']);

        return inertia('public/tracking', [
            'order' => $order,
            'review' => $order->review,
            'canReview' => $order->status === 'delivered' && !$order->review,
        ]);
    }
}
