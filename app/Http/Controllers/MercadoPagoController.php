<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class MercadoPagoController extends Controller
{
    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
    }

    public function processPayment(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'payment_method_id' => 'required|string',
            'issuer_id' => 'nullable|string',
            'installments' => 'required|integer',
            'transaction_amount' => 'required|numeric',
            'payer.email' => 'nullable|string',
            'payer.identification.type' => 'nullable|string',
            'payer.identification.number' => 'nullable|string',
        ]);

        $client = new PaymentClient();

        try {
            $payment = $client->create([
                'transaction_amount' => (float) $validated['transaction_amount'],
                'token' => $validated['token'],
                'description' => 'Pedido Empandas',
                'installments' => (int) $validated['installments'],
                'payment_method_id' => $validated['payment_method_id'],
                'issuer_id' => $validated['issuer_id'] ?? null,
                'payer' => [
                    'email' => $validated['payer']['email'],
                    'identification' => [
                        'type' => $validated['payer']['identification']['type'] ?? null,
                        'number' => $validated['payer']['identification']['number'] ?? null,
                    ],
                ],
            ]);

            Log::info('Respuesta de Mercado Pago', [
                'status' => $payment->status,
                'status_detail' => $payment->status_detail,
                'id' => $payment->id,
            ]);

            return response()->json([
                'status' => $payment->status,
                'status_detail' => $payment->status_detail,
                'id' => $payment->id,
            ]);
        } catch (MPApiException $e) {
            $apiResponse = $e->getApiResponse();
            
            return response()->json([
                'status' => 'error_mp',
                'message' => $apiResponse?->getContent() ?? $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error al procesar pago con Mercado Pago', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error_php',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ], 500);
        }
    }
}