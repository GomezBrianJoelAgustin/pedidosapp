<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class PublicTrackingController extends Controller
{
    public function show(Request $request, $token)
    {
        $order = Order::where('tracking_token', $token)
            ->with('items.product')
            ->firstOrFail();

        $order->makeHidden('tracking_token');

        return inertia('public/tracking', [
            'order' => $order,
            'review' => $order->review,
            'canReview' => $order->status === 'delivered' && !$order->review,
        ]);
    }
}
