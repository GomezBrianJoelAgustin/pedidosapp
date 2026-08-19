<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;

class CategoryController extends Controller
{

    public static function getActiveWithActiveProducts()
    {
        return static::where('active', true)
            ->with(['products' => function ($query) {
                $query->where('active', true);
            }])
            ->get();
    }

    public function index()
    {
        $categories = Category::with('products')->latest()->paginate(10);
        
        return Inertia::render('Categories/Index', [
            'categories' => $categories
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        Category::create($request->validated());

        return redirect()->route('admin.categories')->with('success', 'Category created successfully.');
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return redirect()->route('admin.categories')->with('success', 'Category updated successfully.');
    }
       
    public function destroy(Category $category)
    {
        $category->delete();

        return redirect()->route('admin.categories')->with('success', 'Categoría eliminada correctamente.');
    }
}
