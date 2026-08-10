<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
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
            'status' => 'required|string|in:pending,awaiting_approval,approved,rejected,preparing,ready,delivered',
            'payment_status' => 'required|string|in:pending,paid,failed',
            'delivery_type' => 'nullable|string|in:takeaway,delivery',
            'delivery_address' => 'required_if:delivery_type,delivery|nullable|string',
        ];
    }
}
