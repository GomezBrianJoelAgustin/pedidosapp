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
            ->with('items.product', 'reviews')
            ->distinct()
            ->latest()
            ->paginate(10);

        return Inertia::render('client/dashboard', [
            'orders' => $orders,
        ]);
    }
}