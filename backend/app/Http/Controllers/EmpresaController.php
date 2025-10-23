<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveEmpresaRequest;
use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $filtroBuscar = $request->input('filtros.buscar', '');

        $query = Empresa::query();

        if ($filtroBuscar) {
            $query->where(function ($q) use ($filtroBuscar) {
                $q->where('ruc', 'like', "%$filtroBuscar%")
                  ->orWhere('nombre', 'like', "%$filtroBuscar%");
            });
        }

        $empresas = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'content' => [
                'empresas' => $empresas,
            ],
        ]);
    }

    public function store(SaveEmpresaRequest $request)
    {
        $empresa = Empresa::create($request->validated());

        return response()->json([
            'status' => 'success',
            'content' => [
                'empresa' => $empresa,
            ],
            'message' => 'Empresa creada exitosamente.',
        ], 201);
    }

    public function show(Empresa $empresa)
    {
        return response()->json([
            'status' => 'success',
            'content' => [
                'empresa' => $empresa,
            ],
        ]);
    }

    public function update(SaveEmpresaRequest $request, Empresa $empresa)
    {
        $empresa->update($request->validated());

        return response()->json([
            'status' => 'success',
            'content' => [
                'empresa' => $empresa,
            ],
            'message' => 'Empresa actualizada exitosamente.',
        ]);
    }

    public function destroy(Empresa $empresa)
    {
        $empresa->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Empresa eliminada exitosamente.',
        ]);
    }
}
