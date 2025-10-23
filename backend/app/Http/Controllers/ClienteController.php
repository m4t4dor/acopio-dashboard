<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveClienteRequest;
use App\Models\Cliente;
use App\Models\Sucursal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(): JsonResponse
    {
        $authUser = auth()->user();

        $filtros = request()->query('filtros');
        $filtroBuscar = $filtros['buscar'] ?? null;

        $query = Cliente::with('sucursal')
            ->where('sucursal_id', $authUser->sucursal_id)
            ->when($filtroBuscar, function ($query, $filtroBuscar) {
                return $query->where(function ($subQuery) use ($filtroBuscar) {
                    $subQuery->where('nombres', 'like', "%$filtroBuscar%")
                        ->orWhere('nombre_comercial', 'like', "%$filtroBuscar%")
                        ->orWhere('documento_numero', 'like', "%$filtroBuscar%");
                });
            })
            ->orderBy('nombres')
            ->orderBy('nombre_comercial');

        $clientes = $query->paginate(request('per_page'));

        return response()->json(['content' => [
            'clientes' => $clientes,
        ]]);
    }

    public function create(): JsonResponse
    {
        $authUser = auth()->user();

        $sucursales = Sucursal::activos()
            ->where('id', $authUser->sucursal_id)
            ->orderBy('nombre')
            ->get();

        return response()->json(['content' => [
            'sucursales' => $sucursales
        ]]);
    }

    public function store(SaveClienteRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Filtrar teléfonos vacíos y mantener solo los que tienen valor
        if (isset($validated['telefono']) && is_array($validated['telefono'])) {
            $validated['telefono'] = array_filter($validated['telefono'], function($telefono) {
                return !empty(trim($telefono));
            });
            
            // Si no hay teléfonos válidos, establecer como null
            if (empty($validated['telefono'])) {
                $validated['telefono'] = null;
            } else {
                // Reindexar el array para evitar gaps
                $validated['telefono'] = array_values($validated['telefono']);
            }
        }
        
        $cliente = Cliente::create($validated);
        $cliente->load('sucursal');

        return response()->json([
            'content' => [
                'cliente' => $cliente
            ],
            'message' => 'Cliente creado exitosamente'
        ], 201);
    }

    public function show(Cliente $cliente): JsonResponse
    {
        $cliente->load('sucursal');

        return response()->json(['content' => [
            'cliente' => $cliente
        ]]);
    }

    public function edit(Cliente $cliente): JsonResponse
    {
        $authUser = auth()->user();

        $cliente->load('sucursal');

        $sucursales = Sucursal::activos()
            ->where('id', $authUser->sucursal_id)
            ->orderBy('nombre')
            ->get();

        return response()->json(['content' => [
            'cliente' => $cliente,
            'sucursales' => $sucursales
        ]]);
    }

    public function update(SaveClienteRequest $request, Cliente $cliente): JsonResponse
    {
        $validated = $request->validated();
        
        // Filtrar teléfonos vacíos y mantener solo los que tienen valor
        if (isset($validated['telefono']) && is_array($validated['telefono'])) {
            $validated['telefono'] = array_filter($validated['telefono'], function($telefono) {
                return !empty(trim($telefono));
            });
            
            // Si no hay teléfonos válidos, establecer como null
            if (empty($validated['telefono'])) {
                $validated['telefono'] = null;
            } else {
                // Reindexar el array para evitar gaps
                $validated['telefono'] = array_values($validated['telefono']);
            }
        }
        
        $cliente->update($validated);
        $cliente->load('sucursal');

        return response()->json([
            'content' => [
                'cliente' => $cliente
            ],
            'message' => 'Cliente actualizado exitosamente'
        ]);
    }

    public function destroy(Cliente $cliente): JsonResponse
    {
        $cliente->delete();

        return response()->json([
            'message' => 'Cliente eliminado exitosamente'
        ]);
    }

    public function prestamos(Cliente $cliente)
    {
        $authUser = auth()->user();

        $prestamos = $cliente->prestamos()
            ->where('sucursal_id', $authUser->sucursal_id)
            ->with(['cuotas'])
            ->whereIn('estado', ['activo', 'vencido', 'vencido_critico'])
            ->orderByRaw("CASE 
                WHEN estado = 'vencido_critico' THEN 1 
                WHEN estado = 'vencido' THEN 2 
                WHEN estado = 'activo' THEN 3 
                ELSE 4 
            END")
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Préstamos obtenidos correctamente.',
            'content' => [
                'prestamos' => $prestamos,
            ]
        ]);
    }
}
