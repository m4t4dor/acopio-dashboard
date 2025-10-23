<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\PlanLimiteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AutenticacionController extends Controller
{
    function iniciarSesion(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required'
        ], [
            'username.required' => 'Ingrese su usuario',
            'password.required' => 'Ingrese su contraseña'
        ]);

        $credentials = $request->only('username', 'password');

        if (!auth()->attempt($credentials)) {
            return response()->json([
                'errors' => [
                    'username' => ['Usuario o contraseña incorrectos']
                ]
            ], 422);
        }

        /** @var \App\Models\User */
        $usuario = auth()->user();
        $usuario->load('sucursal');

        // Verificar si el activo del usuario es false
        if (!$usuario->activo) {
            return response()->json([
                'errors' => [
                    'username' => ['El usuario está inactivo']
                ]
            ], 422);
        }

        $token = $usuario->createToken('token')->plainTextToken;

        return response()->json([
            'content' => [
                'token' => $token,
                'usuario' => $usuario,
            ]
        ]);
    }

    function cerrarSesion()
    {
        /** @var \App\Models\User */
        $usuario = auth()->user();

        $usuario->tokens()->delete();

        return response()->json([
            'message' => 'Sesión cerrada'
        ]);
    }

    function usuario()
    {
        /** @var \App\Models\User */
        $usuario = auth()->user();

        $usuario->load('sucursal');

        return response()->json([
            'content' => [
                'usuario' => $usuario
            ]
        ]);
    }

    function cambiarSucursal(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
        ], [
            'sucursal_id.required' => 'Seleccione una sucursal',
            'sucursal_id.exists' => 'La sucursal seleccionada no existe',
        ]);

        /** @var \App\Models\User */
        $usuario = auth()->user();
        $usuario->sucursal_id = $request->input('sucursal_id');
        $usuario->save();

        return response()->json([
            'message' => 'Sucursal cambiada correctamente'
        ]);
    }

    function cambiarPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|confirmed|min:8',
        ], [
            'password.required' => 'Ingrese su nueva contraseña',
            'password.confirmed' => 'La confirmación de la contraseña no coincide',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
        ]);

        /** @var \App\Models\User */
        $usuario = auth()->user();
        $usuario->password = $request->input('password');
        $usuario->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }
}
