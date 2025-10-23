<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var \App\Models\User */
        $user = auth()->user();

        if (!$user->activo || $user->deleted_at) {
            return response()->json(['message' => 'Usuario inactivo'], 401);
        }

        return $next($request);
    }
}
