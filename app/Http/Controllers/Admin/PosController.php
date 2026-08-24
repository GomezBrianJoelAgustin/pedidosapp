<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePosRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        return Inertia::render('Pos/Index', [
            'categories' => Category::where('active', true)->get(),
            'products' => Product::where('active', true)->get(),
        ]);
    }

    public function store(StorePosRequest $request)
    {
        $validated = $request->validated();

        $productIds = collect($validated['items'])->pluck('product_id')->unique();
        $inactiveProducts = Product::whereIn('id', $productIds)
            ->where('active', false)
            ->pluck('name');

        if ($inactiveProducts->isNotEmpty()) {
            return back()->withErrors([
                'items' => 'Los siguientes productos ya no están disponibles: ' . $inactiveProducts->implode(', '),
            ]);
        }

        DB::transaction(function () use ($validated) {
            $userId = auth()->id();

            $order = Order::create([
                'user_id' => $userId,
                'delivery_id' => $userId, 
                'status' => 'awaiting_approval',
                'pin' => str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT),
                'delivery_type' => $validated['delivery_type'] ?? 'takeaway', 
                'delivery_address' => $validated['delivery_address'] ?? null,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'paid',
                'total_price' => $validated['total_price'],
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }
        });

        return redirect()->route('admin.orders')->with('success', 'Venta realizada con éxito');
    }
}