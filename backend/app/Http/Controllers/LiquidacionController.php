<?php

namespace App\Http\Controllers;

use App\Models\Liquidacion;
use App\Models\LiquidacionItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LiquidacionController extends Controller
{
    /**
     * Listar todas las liquidaciones
     */
    public function index(Request $request): JsonResponse
    {
        $query = Liquidacion::with(['items', 'usuario'])
            ->orderBy('created_at', 'desc');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $liquidaciones = $query->get();

        return response()->json([
            'success' => true,
            'content' => $liquidaciones,
        ]);
    }

    /**
     * Obtener una liquidación por ID
     */
    public function show($id): JsonResponse
    {
        $liquidacion = Liquidacion::with(['items', 'usuario'])->find($id);

        if (!$liquidacion) {
            return response()->json([
                'success' => false,
                'message' => 'Liquidación no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'content' => $liquidacion,
        ]);
    }

    /**
     * Crear una nueva liquidación
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'numero_documento' => 'required|string|max:50',
            'nombre_archivo' => 'required|string|max:255',
            'fecha_procesamiento' => 'required|date',
            'total_items' => 'required|integer|min:0',
            'total_general' => 'required|numeric|min:0',
            'estado' => 'required|in:procesado,pendiente,error',
            'items' => 'required|array|min:1',
            'items.*.kardex' => 'required|string|max:20',
            'items.*.descripcion' => 'nullable|string',
            'items.*.fecha' => 'required|string|max:20',
            'items.*.proveedor' => 'required|string|max:255',
            'items.*.ruc_dni' => 'required|string|max:20',
            'items.*.ingreso' => 'required|numeric|min:0',
            'items.*.salida' => 'required|numeric|min:0',
            'items.*.costo_unitario' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $liquidacion = Liquidacion::create([
                'numero_documento' => $request->numero_documento,
                'nombre_archivo' => $request->nombre_archivo,
                'fecha_procesamiento' => $request->fecha_procesamiento,
                'total_items' => $request->total_items,
                'total_general' => $request->total_general,
                'estado' => $request->estado,
                'usuario_id' => auth()->id(),
            ]);

            foreach ($request->items as $itemData) {
                LiquidacionItem::create([
                    'liquidacion_id' => $liquidacion->id,
                    'kardex' => $itemData['kardex'],
                    'descripcion' => $itemData['descripcion'] ?? null,
                    'fecha' => $itemData['fecha'],
                    'proveedor' => $itemData['proveedor'],
                    'ruc_dni' => $itemData['ruc_dni'],
                    'ingreso' => $itemData['ingreso'],
                    'salida' => $itemData['salida'],
                    'costo_unitario' => $itemData['costo_unitario'],
                    'total' => $itemData['total'],
                ]);
            }

            DB::commit();

            $liquidacion->load('items');

            return response()->json([
                'success' => true,
                'message' => 'Liquidación creada exitosamente',
                'content' => $liquidacion,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la liquidación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar una liquidación
     */
    public function update(Request $request, $id): JsonResponse
    {
        $liquidacion = Liquidacion::find($id);

        if (!$liquidacion) {
            return response()->json([
                'success' => false,
                'message' => 'Liquidación no encontrada',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'numero_documento' => 'sometimes|string|max:50',
            'nombre_archivo' => 'sometimes|string|max:255',
            'estado' => 'sometimes|in:procesado,pendiente,error',
            'total_items' => 'sometimes|integer|min:0',
            'total_general' => 'sometimes|numeric|min:0',
            'items' => 'sometimes|array',
            'items.*.id' => 'sometimes|integer',
            'items.*.kardex' => 'required_with:items|string|max:20',
            'items.*.descripcion' => 'nullable|string',
            'items.*.fecha' => 'required_with:items|string|max:20',
            'items.*.proveedor' => 'required_with:items|string|max:255',
            'items.*.ruc_dni' => 'required_with:items|string|max:20',
            'items.*.ingreso' => 'required_with:items|numeric|min:0',
            'items.*.salida' => 'required_with:items|numeric|min:0',
            'items.*.costo_unitario' => 'required_with:items|numeric|min:0',
            'items.*.total' => 'required_with:items|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Actualizar datos básicos de la liquidación
            $liquidacion->update($request->only([
                'numero_documento',
                'nombre_archivo',
                'estado',
                'total_items',
                'total_general',
            ]));

            // Si se envían items, actualizar/crear/eliminar
            if ($request->has('items')) {
                // Obtener IDs de items existentes que vienen en el request
                $itemsIds = collect($request->items)
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                // Eliminar items que ya no están en el request
                $liquidacion->items()
                    ->whereNotIn('id', $itemsIds)
                    ->delete();

                // Actualizar o crear items
                foreach ($request->items as $itemData) {
                    if (isset($itemData['id'])) {
                        // Actualizar item existente
                        LiquidacionItem::where('id', $itemData['id'])
                            ->where('liquidacion_id', $liquidacion->id)
                            ->update([
                                'kardex' => $itemData['kardex'],
                                'descripcion' => $itemData['descripcion'] ?? null,
                                'fecha' => $itemData['fecha'],
                                'proveedor' => $itemData['proveedor'],
                                'ruc_dni' => $itemData['ruc_dni'],
                                'ingreso' => $itemData['ingreso'],
                                'salida' => $itemData['salida'],
                                'costo_unitario' => $itemData['costo_unitario'],
                                'total' => $itemData['total'],
                            ]);
                    } else {
                        // Crear nuevo item
                        LiquidacionItem::create([
                            'liquidacion_id' => $liquidacion->id,
                            'kardex' => $itemData['kardex'],
                            'descripcion' => $itemData['descripcion'] ?? null,
                            'fecha' => $itemData['fecha'],
                            'proveedor' => $itemData['proveedor'],
                            'ruc_dni' => $itemData['ruc_dni'],
                            'ingreso' => $itemData['ingreso'],
                            'salida' => $itemData['salida'],
                            'costo_unitario' => $itemData['costo_unitario'],
                            'total' => $itemData['total'],
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Liquidación actualizada exitosamente',
                'content' => $liquidacion->fresh()->load('items'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la liquidación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una liquidación
     */
    public function destroy($id): JsonResponse
    {
        $liquidacion = Liquidacion::find($id);

        if (!$liquidacion) {
            return response()->json([
                'success' => false,
                'message' => 'Liquidación no encontrada',
            ], 404);
        }

        $liquidacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Liquidación eliminada exitosamente',
        ]);
    }

    /**
     * Procesar PDF (placeholder - el procesamiento se hace en frontend)
     */
    public function procesarPDF(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'archivo' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo PDF inválido',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Aquí podrías agregar procesamiento adicional del PDF en el servidor si lo necesitas
        // Por ahora retornamos success para que el frontend maneje el procesamiento

        return response()->json([
            'success' => true,
            'message' => 'PDF recibido correctamente',
        ]);
    }
}
