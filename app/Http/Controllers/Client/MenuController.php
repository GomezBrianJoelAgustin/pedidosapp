<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientOrderRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('client/menu', [
            'categories' => Category::getActiveWithActiveProducts(),
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address ?? null,
            ],
            'mercadoPagoPublicKey' => config('services.mercadopago.public_key'),
        ]);
    }

    public function store(StoreClientOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = auth()->user();

        if ($request->filled('phone') && !$user->phone) {
            $user->update(['phone' => $request->input('phone')]);
        }

        $productIds = collect($validated['items'])->pluck('product_id')->unique();
        $inactiveProducts = Product::whereIn('id', $productIds)
            ->where('active', false)
            ->pluck('name');

        if ($inactiveProducts->isNotEmpty()) {
            return back()->withErrors([
                'items' => 'Los siguientes productos ya no están disponibles: ' . $inactiveProducts->implode(', '),
            ]);
        }

        DB::transaction(function () use ($validated, $user) {
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => ($validated['payment_gateway_status'] ?? 'pending') === 'approved' ? 'paid' : 'pending',
                'payment_method' => $validated['payment_method'],
                'delivery_type' => $validated['delivery_type'],
                'delivery_address' => $validated['delivery_address'] ?? null,
                'total_price' => $validated['total_price'],
                'payment_gateway_id' => $validated['payment_gateway_id'] ?? null,
                'payment_gateway_status' => $validated['payment_gateway_status'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }
        });

        return redirect()->route('client.dashboard')->with('success', '¡Pedido realizado con éxito!');
    }
}