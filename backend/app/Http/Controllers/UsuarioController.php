<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveUsuarioRequest;
use App\Models\User;
use App\Models\Sucursal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function index(): JsonResponse
    {
        $usuarios = User::with('sucursal')
            ->orderBy('nombre_completo')
            ->paginate(request('per_page'));

        return response()->json(['content' => [
            'usuarios' => $usuarios
        ]]);
    }

    public function create(): JsonResponse
    {
        $sucursales = Sucursal::activos()->orderBy('nombre')->get();

        return response()->json(['content' => [
            'sucursales' => $sucursales
        ]]);
    }

    public function store(SaveUsuarioRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $usuario = User::create($validated);
        $usuario->load('sucursal');

        return response()->json([
            'content' => [
                'usuario' => $usuario
            ],
            'message' => 'Registro creado exitosamente'
        ], 201);
    }

    public function show(User $usuario): JsonResponse
    {
        $usuario->load('sucursal');

        return response()->json(['content' => [
            'usuario' => $usuario
        ]]);
    }

    public function edit(User $usuario): JsonResponse
    {
        $usuario->load('sucursal');
        $sucursales = Sucursal::activos()->orderBy('nombre')->get();

        return response()->json(['content' => [
            'usuario' => $usuario,
            'sucursales' => $sucursales
        ]]);
    }

    public function update(SaveUsuarioRequest $request, User $usuario): JsonResponse
    {
        $validated = $request->validated();

        if (blank($validated['password'] ?? null)) {
            unset($validated['password']);
        }

        $usuario->update($validated);
        $usuario->load('sucursal');

        return response()->json([
            'content' => [
                'usuario' => $usuario
            ],
            'message' => 'Registro actualizado exitosamente'
        ]);
    }

    public function destroy(User $usuario): JsonResponse
    {
        // validacion: no se puede eliminar a sí mismo
        if ($usuario->id == auth()->id()) {
            return response()->json([
                'message' => 'No puedes eliminar tu propio usuario'
            ], 422);
        }

        $usuario->delete();
        return response()->json([
            'message' => 'Registro eliminado exitosamente'
        ]);
    }
}
