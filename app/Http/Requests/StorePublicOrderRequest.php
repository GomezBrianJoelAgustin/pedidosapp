<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'guest_email' => 'required_if:payment_method,card|email|max:255',
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

    public function messages(): array
    {
        return [
            'guest_name.required' => 'Ingresá tu nombre para continuar.',
            'guest_phone.required' => 'Ingresá un teléfono de contacto.',
            'guest_email.required_if' => 'Ingresá tu email para pagar con tarjeta.',
            'delivery_address.required_if' => 'Ingresá la dirección de entrega.',
            'items.required' => 'El carrito no puede estar vacío.',
            'items.min' => 'Agregá al menos un producto.',
        ];
    }
}