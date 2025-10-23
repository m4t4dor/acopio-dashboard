<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerificarNoEsAsistente
{
    public function handle(Request $request, Closure $next)
    {
        /** @var \App\Models\User $usuario */
        $usuario = Auth::user();

        if ($usuario->es_rol_asistente == true) {
            return response()->json([
                'message' => 'No tiene permisos para realizar esta acción'
            ], 403);
        }

        return $next($request);
    }
}
