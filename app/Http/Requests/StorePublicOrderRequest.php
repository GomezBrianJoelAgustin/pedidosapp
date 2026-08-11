<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StorePublicOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'required|string|max:30',
            'guest_email' => 'required|email|max:255',
            'payment_method' => 'required|string|in:effective,card,transfer',
            'delivery_type' => 'required|string|in:takeaway,delivery',
            'delivery_address' => 'required_if:delivery_type,delivery|nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total_price' => 'required|numeric|min:0',
            'payment_gateway_id' => 'nullable|string',
            'payment_gateway_status' => 'nullable|string|in:approved,in_process,rejected',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}