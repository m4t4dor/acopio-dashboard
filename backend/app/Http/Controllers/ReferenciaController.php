<?php

namespace App\Http\Controllers;

use App\Models\Referencia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ReferenciaController extends Controller
{
    /**
     * Listar todas las referencias
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Referencia::query();

            // Filtro por estado activo
            if ($request->has('activo')) {
                $query->where('activo', $request->boolean('activo'));
            }

            // Búsqueda por código o descripción
            if ($request->has('buscar')) {
                $buscar = $request->input('buscar');
                $query->where(function($q) use ($buscar) {
                    $q->where('codigo_compra', 'LIKE', "%{$buscar}%")
                      ->orWhere('descripcion', 'LIKE', "%{$buscar}%")
                      ->orWhere('num_kardex', 'LIKE', "%{$buscar}%");
                });
            }

            $referencias = $query->orderBy('codigo_compra')->get();

            return response()->json([
                'content' => $referencias
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener referencias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva referencia
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'codigo_compra' => 'required|string|max:255|unique:referencias,codigo_compra',
                'descripcion' => 'required|string',
                'num_kardex' => 'required|string|max:255',
                'activo' => 'boolean',
            ], [
                'codigo_compra.required' => 'El código de compra es obligatorio',
                'codigo_compra.unique' => 'Este código de compra ya existe',
                'descripcion.required' => 'La descripción es obligatoria',
                'num_kardex.required' => 'El número de kardex es obligatorio',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $referencia = Referencia::create($validator->validated());

            return response()->json([
                'message' => 'Referencia creada exitosamente',
                'content' => [
                    'referencia' => $referencia
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear referencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar una referencia específica
     */
    public function show(int $id): JsonResponse
    {
        try {
            $referencia = Referencia::findOrFail($id);
            return response()->json([
                'content' => $referencia
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Referencia no encontrada',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar una referencia
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $referencia = Referencia::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'codigo_compra' => 'required|string|max:255|unique:referencias,codigo_compra,' . $id,
                'descripcion' => 'required|string',
                'num_kardex' => 'required|string|max:255',
                'activo' => 'boolean',
            ], [
                'codigo_compra.required' => 'El código de compra es obligatorio',
                'codigo_compra.unique' => 'Este código de compra ya existe',
                'descripcion.required' => 'La descripción es obligatoria',
                'num_kardex.required' => 'El número de kardex es obligatorio',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $referencia->update($validator->validated());

            return response()->json([
                'message' => 'Referencia actualizada exitosamente',
                'content' => [
                    'referencia' => $referencia
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar referencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una referencia (soft delete)
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $referencia = Referencia::findOrFail($id);
            $referencia->delete();

            return response()->json([
                'message' => 'Referencia eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar referencia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar kardex sugerido por código o descripción
     */
    public function buscarKardex(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'codigo_descripcion' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $codigoDescripcion = $request->input('codigo_descripcion');
            $kardexSugerido = Referencia::obtenerKardexSugerido($codigoDescripcion);

            if ($kardexSugerido) {
                return response()->json([
                    'content' => [
                        'encontrado' => true,
                        'num_kardex' => $kardexSugerido
                    ]
                ]);
            }

            return response()->json([
                'content' => [
                    'encontrado' => false,
                    'num_kardex' => null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al buscar kardex',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggleActivo(int $id): JsonResponse
    {
        try {
            $referencia = Referencia::findOrFail($id);
            $referencia->activo = !$referencia->activo;
            $referencia->save();

            return response()->json([
                'message' => 'Estado actualizado exitosamente',
                'content' => [
                    'referencia' => $referencia
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al cambiar estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Importar referencias desde un array (útil para importaciones masivas)
     */
    public function importar(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'referencias' => 'required|array',
                'referencias.*.codigo_compra' => 'required|string',
                'referencias.*.descripcion' => 'required|string',
                'referencias.*.num_kardex' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $importadas = 0;
            $errores = [];

            foreach ($request->input('referencias') as $index => $data) {
                try {
                    Referencia::updateOrCreate(
                        ['codigo_compra' => $data['codigo_compra']],
                        [
                            'descripcion' => $data['descripcion'],
                            'num_kardex' => $data['num_kardex'],
                            'activo' => $data['activo'] ?? true,
                        ]
                    );
                    $importadas++;
                } catch (\Exception $e) {
                    $errores[] = [
                        'linea' => $index + 1,
                        'codigo' => $data['codigo_compra'],
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'message' => "Importación completada: {$importadas} referencias procesadas",
                'content' => [
                    'importadas' => $importadas,
                    'errores' => $errores
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al importar referencias',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
