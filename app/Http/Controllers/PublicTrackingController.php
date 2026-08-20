<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;
use Illuminate\Http\Request;

class PublicTrackingController extends Controller
{
    public function show(Request $request, $token)
    {
        $order = Order::where('tracking_token', $token)
            ->with('items.product', 'user', 'delivery')
            ->firstOrFail();

        $order->makeHidden('tracking_token');
        $order->makeVisible(['pin']);

        $productReviews = [];
        foreach ($order->items as $item) {
            if ($item->product_id) {
                $reviews = Review::where('product_id', $item->product_id)
                    ->where('order_id', $order->id)
                    ->get()
                    ->map(function (Review $review) use ($order) {
                        if ($review->user_id) {
                            $userName = $review->user?->name ?? 'Cliente';
                        } else {
                            $userName = trim(($order->guest_name ?? 'Cliente') . ' (sin cuenta)');
                        }

                        return [
                            'comment' => $review->comment,
                            'food_rating' => $review->food_rating,
                            'delivery_rating' => $review->delivery_rating,
                            'user_name' => $userName,
                            'created_at' => $review->created_at?->diffForHumans(),
                        ];
                    })
                    ->values()
                    ->all();

                $avgRating = count($reviews) > 0
                    ? round(array_sum(array_column($reviews, 'food_rating')) / count($reviews), 1)
                    : null;

                $productReviews[$item->product_id] = [
                    'reviews' => $reviews,
                    'average' => $avgRating,
                    'count' => count($reviews),
                ];
            }
        }

        return inertia('public/tracking', [
            'order' => $order,
            'review' => $order->review,
            'canReview' => $order->status === 'delivered' && !$order->review,
            'productReviews' => $productReviews,
        ]);
    }

    public function reviews(Request $request, $productId)
    {
        $orderIds = OrderItem::where('product_id', $productId)
            ->distinct()
            ->pluck('order_id');

        $reviews = Review::whereIn('order_id', $orderIds)
            ->with('user', 'order')
            ->latest()
            ->get()
            ->map(function (Review $review) {
                if ($review->user_id) {
                    $userName = $review->user?->name ?? 'Cliente';
                } else {
                    $userName = trim(($review->order->guest_name ?? 'Cliente') . ' (sin cuenta)');
                }

                return [
                    'comment' => $review->comment,
                    'food_rating' => $review->food_rating,
                    'delivery_rating' => $review->delivery_rating,
                    'user_name' => $userName,
                    'created_at' => $review->created_at?->diffForHumans(),
                ];
            })
            ->values()
            ->all();

        $avgRating = count($reviews) > 0
            ? round(array_sum(array_column($reviews, 'food_rating')) / count($reviews), 1)
            : null;

        return response()->json([
            'reviews' => $reviews,
            'average' => $avgRating,
        ]);
    }
}
