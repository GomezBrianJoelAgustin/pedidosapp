<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        if ($user && $user->hasRole('client') && ! $user->hasAnyRole(['super-admin', 'admin', 'cashier', 'chef', 'delivery'])) {
            return redirect()->route('client.dashboard');
        }

        return redirect()->intended(route('dashboard'));
    }
}