<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveSucursalRequest;
use App\Models\Sucursal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    public function index(): JsonResponse
    {
        $sucursales = Sucursal::orderBy('nombre')
            ->paginate(request('per_page'));

        return response()->json(['content' => [
            'sucursales' => $sucursales
        ]]);
    }

    public function create(): JsonResponse
    {
        return response()->json(['content' => []]);
    }

    public function store(SaveSucursalRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $sucursal = Sucursal::create($validated);

        return response()->json([
            'content' => [
                'sucursal' => $sucursal
            ],
            'message' => 'Registro creado exitosamente'
        ], 201);
    }

    public function show(Sucursal $sucursal): JsonResponse
    {
        return response()->json(['content' => [
            'sucursal' => $sucursal
        ]]);
    }

    public function edit(Sucursal $sucursal): JsonResponse
    {
        return response()->json(['content' => [
            'sucursal' => $sucursal,
        ]]);
    }

    public function update(SaveSucursalRequest $request, Sucursal $sucursal): JsonResponse
    {
        $validated = $request->validated();
        $sucursal->update($validated);

        return response()->json([
            'content' => [
                'sucursal' => $sucursal
            ],
            'message' => 'Registro actualizado exitosamente'
        ]);
    }

    public function destroy(Sucursal $sucursal): JsonResponse
    {
        $sucursal->delete();
        return response()->json([
            'message' => 'Registro eliminado exitosamente'
        ]);
    }
}
