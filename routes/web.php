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

Route::get('/', [PublicMenuController::class, 'index'])->name('home');

Route::get('/dashboard', function () {
    if (auth()->user()?->hasRole('client')) {
        return redirect()->route('client.dashboard');
    }
    return redirect()->route('admin.orders');
})->middleware(['auth'])->name('dashboard');

Route::middleware(['auth', 'role:client'])->prefix('mi-cuenta')->name('client.')->group(function () {
    Route::get('/dashboard', [ClientDashboardController::class, 'index'])->name('dashboard');
    Route::get('/menu', [ClientMenuController::class, 'index'])->name('menu');
    Route::post('/pedido', [ClientMenuController::class, 'store'])->name('order.store');
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

Route::post('/pedido', [PublicOrderController::class, 'store'])->name('public.orders.store');
Route::post('/pagos/mercadopago', [MercadoPagoController::class, 'processPayment'])->name('mercadopago.process');

require __DIR__.'/settings.php';