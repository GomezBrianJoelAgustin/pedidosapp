<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $orders = Order::where('user_id', auth()->id())
            ->with('items.product', 'review')
            ->latest()
            ->get();

        return Inertia::render('client/dashboard', [
            'orders' => $orders,
        ]);
    }
}