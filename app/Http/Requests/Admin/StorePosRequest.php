<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePosRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
   public function rules(): array
{
    return [
        'payment_method' => 'required|string',
        'delivery_type' => 'nullable|string|in:takeaway,delivery',
        'delivery_address' => 'required_if:delivery_type,delivery|nullable|string',
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.quantity' => 'required|integer|min:1',
        'items.*.price' => 'required|numeric|min:0',
        'total_price' => 'required|numeric|min:0',
    ];
}

public function messages(): array
{
    return [
        'payment_method.required' => 'Debes seleccionar un método de pago.',
        'delivery_type.in' => 'El tipo de entrega seleccionado no es válido.',
        'delivery_address.required_if' => 'Debes ingresar una dirección de entrega para el envío con cadete.',
        'items.required' => 'El carrito no puede estar vacío.',
        'items.min' => 'Debes agregar al menos un producto al carrito.',
        'items.*.product_id.exists' => 'Uno de los productos seleccionados no existe.',
        'items.*.quantity.min' => 'La cantidad debe ser al menos 1.',
    ];
}
}
