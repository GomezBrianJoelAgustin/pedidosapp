<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build()
    {
        return $this->subject("Tu pedido #{$this->order->id} fue recibido - Empanadas 360")
                    ->view('emails.order-confirmation')
                    ->with([
                        'order' => $this->order,
                        'pin' => $this->order->pin,
                    ]);
    }
}
