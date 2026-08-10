<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashierController extends Controller
{
    public function index()
    {
        $pendingAssignment = Order::with(['items.product', 'user', 'delivery'])
            ->where('delivery_type', 'delivery')
            ->whereNull('delivery_id')
            ->whereNotIn('status', ['delivered'])
            ->latest()
            ->get();

        $pendingCashPayment = Order::with(['items.product', 'user', 'delivery'])
            ->where('payment_method', 'effective')
            ->where('payment_status', 'pending')
            ->whereNotIn('status', ['delivered'])
            ->latest()
            ->get();

        $recentOrders = Order::with(['items.product', 'user', 'delivery'])
            ->whereIn('status', ['pending', 'preparing', 'ready', 'delivered'])
            ->latest()
            ->take(20)
            ->get();

        $deliveryUsers = User::role('delivery')->get(['id', 'name', 'email']);

        return Inertia::render('Cashier/Index', [
            'pendingAssignment' => $pendingAssignment,
            'pendingCashPayment' => $pendingCashPayment,
            'recentOrders' => $recentOrders,
            'deliveryUsers' => $deliveryUsers,
        ]);
    }

    public function assignDelivery(Request $request, Order $order)
    {
        $request->validate([
            'delivery_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();

        if (! $user->hasRole('cashier') && ! $user->hasRole('super-admin') && ! $user->hasRole('admin')) {
            abort(403);
        }

        $order->update([
            'delivery_id' => $request->delivery_id,
        ]);

        return back()->with('success', 'Cadete asignado correctamente.');
    }

    public function markCashPaid(Request $request, Order $order)
    {
        $request->validate([
            'payment_status' => 'required|string|in:paid',
        ]);

        $user = $request->user();

        if (! $user->hasRole('cashier') && ! $user->hasRole('super-admin') && ! $user->hasRole('admin')) {
            abort(403);
        }

        if ($order->payment_method !== 'effective') {
            return back()->withErrors(['payment_status' => 'Solo se puede marcar como pagado los pedidos en efectivo.']);
        }

        $order->update([
            'payment_status' => $request->payment_status,
        ]);

        return back()->with('success', 'Pago en efectivo marcado como recibido.');
    }
}
