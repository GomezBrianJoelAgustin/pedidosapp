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
        $awaitingApproval = Order::with(['items.product', 'user', 'delivery'])
            ->where('status', 'awaiting_approval')
            ->latest()
            ->get()
            ->makeHidden(['pin']);

        $pendingAssignment = Order::with(['items.product', 'user', 'delivery'])
            ->where('status', 'approved')
            ->where('delivery_type', 'delivery')
            ->whereNull('delivery_id')
            ->whereNotIn('status', ['delivered'])
            ->latest()
            ->get()
            ->makeHidden(['pin']);

        $pendingCashPayment = Order::with(['items.product', 'user', 'delivery'])
            ->where('payment_method', 'effective')
            ->where('payment_status', 'pending')
            ->whereNotIn('status', ['delivered'])
            ->latest()
            ->get()
            ->makeHidden(['pin']);

        $recentOrders = Order::with(['items.product', 'user', 'delivery'])
            ->whereIn('status', ['awaiting_approval', 'approved', 'preparing', 'ready', 'delivered', 'rejected'])
            ->latest()
            ->take(20)
            ->get()
            ->makeHidden(['pin']);

        $rejectedOrders = Order::with(['items.product', 'user', 'delivery'])
            ->where('status', 'rejected')
            ->latest()
            ->get()
            ->makeHidden(['pin']);

        $deliveryUsers = User::role('delivery')->get(['id', 'name', 'email']);

        return Inertia::render('Cashier/Index', [
            'awaitingApproval' => $awaitingApproval,
            'pendingAssignment' => $pendingAssignment,
            'pendingCashPayment' => $pendingCashPayment,
            'recentOrders' => $recentOrders,
            'rejectedOrders' => $rejectedOrders,
            'deliveryUsers' => $deliveryUsers,
        ]);
    }

    public function approve(Request $request, Order $order)
    {
        $user = $request->user();

        if (! $user->hasRole('cashier') && ! $user->hasRole('super-admin') && ! $user->hasRole('admin')) {
            abort(403);
        }

        $order->update([
            'status' => 'approved',
            'approved_by' => $user->id,
        ]);

        return back()->with('success', 'Pedido aprobado correctamente. Ahora va a cocina.');
    }

    public function reject(Request $request, Order $order)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if (! $user->hasRole('cashier') && ! $user->hasRole('super-admin') && ! $user->hasRole('admin')) {
            abort(403);
        }

        $order->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back()->with('success', 'Pedido rechazado correctamente.');
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
