<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items.product', 'user', 'delivery'])
            ->whereIn('status', ['ready', 'delivered'])
            ->latest()
            ->get();

        return Inertia::render('Delivery/Index', [
            'orders' => $orders,
        ]);
    }

    public function validatePin(Request $request, Order $order)
    {
        $request->validate([
            'pin' => 'required|string|size:4',
        ]);

        if ($order->pin !== $request->pin) {
            return back()->withErrors(['pin' => 'El PIN ingresado es incorrecto.'])->withInput();
        }

        $order->update([
            'status' => 'delivered',
        ]);

        return back()->with('success', 'Pedido marcado como entregado correctamente.');
    }
}
