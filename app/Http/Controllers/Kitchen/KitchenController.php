<?php

namespace App\Http\Controllers\Kitchen;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KitchenController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items.product', 'user', 'delivery'])
            ->whereIn('status', ['approved', 'preparing', 'ready'])
            ->latest()
            ->get()
            ->makeHidden(['pin']);

        return Inertia::render('Kitchen/Index', [
            'orders' => $orders,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|string|in:preparing,ready',
        ]);

        $order->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Estado de la orden actualizado correctamente.');
    }
}
