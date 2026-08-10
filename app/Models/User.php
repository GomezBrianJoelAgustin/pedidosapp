<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements PasskeyUser
{
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Boot del modelo para asignar el rol automáticamente al crear el registro
     */
    protected static function booted(): void
    {
        static::created(function (User $user) {
            // Evitamos asignar si ya tiene un rol asignado (por ejemplo, en Seeders)
            if ($user->roles()->count() === 0) {
                $user->assignRole('client');
            }
        });
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Order::class, 'delivery_id');
    }
}