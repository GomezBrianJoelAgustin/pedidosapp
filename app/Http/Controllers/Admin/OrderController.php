<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Inertia\Inertia;
use App\Http\Requests\Admin\UpdateOrderRequest;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items.product', 'user', 'delivery'])->latest()->get();

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order)
    {
        $order->update($request->validated());

        return redirect()->route('admin.orders')->with('success', 'Order updated successfully.');
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('admin.orders')->with('success', 'Order deleted successfully.');
    }
}