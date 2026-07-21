<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index()
    {
        $menu = Category::where('active', true)
        ->with(['products' => function ($query) {
            $query->where('active', true);
        }])
        ->get();

        return Inertia::render('welcome', [
            'menu' => $menu
        ]);
    }
}
