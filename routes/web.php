<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\PosController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\PublicOrderController;
use App\Http\Controllers\MercadoPagoController;
use App\Http\Controllers\MenuController as PublicMenuController;
use App\Http\Controllers\Client\MenuController as ClientMenuController;
use App\Http\Controllers\Client\DashboardController as ClientDashboardController;
use App\Http\Controllers\Kitchen\KitchenController;
use App\Http\Controllers\Delivery\DeliveryController;
use App\Http\Controllers\Cashier\CashierController;

Route::get('/', [PublicMenuController::class, 'index'])->name('home');

Route::get('/dashboard', function () {
    if (auth()->user()?->hasRole('client')) {
        return redirect()->route('client.dashboard');
    }
    if (auth()->user()?->hasRole('chef')) {
        return redirect()->route('kitchen.dashboard');
    }
    if (auth()->user()?->hasRole('delivery')) {
        return redirect()->route('delivery.dashboard');
    }
    if (auth()->user()?->hasRole('cashier')) {
        return redirect()->route('cashier.dashboard');
    }
    return redirect()->route('admin.orders');
})->middleware(['auth'])->name('dashboard');

Route::middleware(['auth', 'role:client'])->prefix('mi-cuenta')->name('client.')->group(function () {
    Route::get('/dashboard', [ClientDashboardController::class, 'index'])->name('dashboard');
    Route::get('/menu', [ClientMenuController::class, 'index'])->name('menu');
    Route::post('/pedido', [ClientMenuController::class, 'store'])->name('order.store');
    Route::post('/orders/{order}/review', [\App\Http\Controllers\Client\ReviewController::class, 'store'])->name('orders.review');
});

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [OrderController::class, 'index'])->name('dashboard');
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/products', [ProductController::class, 'index'])->name('products');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('/pos', [PosController::class, 'index'])->name('pos');
    Route::post('/pos', [PosController::class, 'store'])->name('pos.store');

    Route::get('/orders', [OrderController::class, 'index'])->name('orders');
    Route::put('/orders/{order}', [OrderController::class, 'update'])->name('orders.update');
    Route::delete('/orders/{order}', [OrderController::class, 'destroy'])->name('orders.destroy');
});

Route::middleware(['auth', 'role:chef'])->prefix('cocina')->name('kitchen.')->group(function () {
    Route::get('/', [KitchenController::class, 'index'])->name('dashboard');
    Route::put('/orders/{order}', [KitchenController::class, 'update'])->name('orders.update');
});

Route::middleware(['auth', 'role:delivery'])->prefix('cadetes')->name('delivery.')->group(function () {
    Route::get('/', [DeliveryController::class, 'index'])->name('dashboard');
    Route::post('/orders/{order}/mark-out-for-delivery', [DeliveryController::class, 'markOutForDelivery'])->name('orders.mark-out-for-delivery');
    Route::post('/orders/{order}/mark-at-location', [DeliveryController::class, 'markAtLocation'])->name('orders.mark-at-location');
    Route::post('/orders/{order}/validate-pin', [DeliveryController::class, 'validatePin'])->name('orders.validate-pin');
});

Route::middleware(['auth', 'role:cashier'])->prefix('caja')->name('cashier.')->group(function () {
    Route::get('/', [CashierController::class, 'index'])->name('dashboard');
    Route::post('/orders/{order}/approve', [CashierController::class, 'approve'])->name('orders.approve');
    Route::post('/orders/{order}/reject', [CashierController::class, 'reject'])->name('orders.reject');
    Route::post('/orders/{order}/assign-delivery', [CashierController::class, 'assignDelivery'])->name('orders.assign-delivery');
    Route::post('/orders/{order}/mark-cash-paid', [CashierController::class, 'markCashPaid'])->name('orders.mark-cash-paid');
    Route::post('/orders/{order}/validate-pin', [CashierController::class, 'validatePin'])->name('orders.validate-pin');
    Route::post('/orders/{order}/update-payment-status', [CashierController::class, 'updatePaymentStatus'])->name('orders.update-payment-status');
});

Route::post('/pedido', [PublicOrderController::class, 'store'])->name('public.orders.store');
Route::get('/order/track/{token}', [\App\Http\Controllers\PublicTrackingController::class, 'show'])->name('public.order.track');
Route::post('/order/track/{order}/review', [\App\Http\Controllers\PublicReviewController::class, 'store'])->name('public.orders.review');
Route::post('/pagos/mercadopago', [MercadoPagoController::class, 'processPayment'])->name('mercadopago.process');

require __DIR__.'/settings.php';