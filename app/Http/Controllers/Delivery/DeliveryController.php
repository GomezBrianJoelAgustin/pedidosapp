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
            ->where('delivery_type', 'delivery')
            ->whereIn('status', ['ready', 'out_for_delivery', 'at_location', 'delivered'])
            ->latest()
            ->paginate();

        return Inertia::render('Delivery/Index', [
            'orders' => $orders,
        ]);
    }

    public function markOutForDelivery(Request $request, Order $order)
    {
        $order->update(['status' => 'out_for_delivery']);

        return back()->with('success', 'Pedido marcado como en camino.');
    }

    public function markAtLocation(Request $request, Order $order)
    {
        $order->update(['status' => 'at_location']);

        return back()->with('success', 'Pedido marcado como cadete en la puerta.');
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
