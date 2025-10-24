<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Liquidacion;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    /**
     * Reporte de Ventas (Salidas) por Proveedor en un periodo
     * Las ventas son las SALIDAS de inventario hacia clientes
     */
    public function reporteVentas(Request $request)
    {
        $request->validate([
            'empresa_matriz_id' => 'nullable|integer',
            'empresa_ruc' => 'nullable|string',
            'proveedor' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $query = DB::table('liquidacion_items')
            ->join('liquidaciones', 'liquidacion_items.liquidacion_id', '=', 'liquidaciones.id')
            ->where('liquidacion_items.salida', '>', 0) // Solo salidas (ventas)
            ->whereBetween(DB::raw('STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")'), [$request->fecha_inicio, $request->fecha_fin]);

        // Filtrar por empresa matriz (RUC de la liquidación)
        if ($request->empresa_matriz_id) {
            // Primero intentar obtener el RUC de la tabla empresas
            $empresaMatriz = DB::table('empresas')->where('id', $request->empresa_matriz_id)->first();
            
            if ($empresaMatriz) {
                $query->where('liquidaciones.numero_documento', $empresaMatriz->ruc);
            } else {
                // Si no existe en empresas, obtener el RUC basado en la posición en liquidaciones
                $liquidacionesUnicas = DB::table('liquidaciones')
                    ->select('numero_documento')
                    ->distinct()
                    ->orderBy('numero_documento')
                    ->get();
                
                // El ID corresponde al índice + 1 en la lista ordenada
                if (isset($liquidacionesUnicas[$request->empresa_matriz_id - 1])) {
                    $ruc = $liquidacionesUnicas[$request->empresa_matriz_id - 1]->numero_documento;
                    $query->where('liquidaciones.numero_documento', $ruc);
                }
            }
        }

        // Filtrar por proveedor (cliente final en caso de ventas)
        if ($request->proveedor) {
            $query->where('liquidacion_items.proveedor', 'LIKE', '%' . $request->proveedor . '%');
        }

        // Filtrar por RUC/DNI del cliente
        if ($request->empresa_ruc) {
            $query->where('liquidacion_items.ruc_dni', $request->empresa_ruc);
        }

        $items = $query->select(
            'liquidacion_items.fecha',
            'liquidacion_items.kardex',
            'liquidacion_items.descripcion',
            'liquidacion_items.proveedor',
            'liquidacion_items.ruc_dni',
            'liquidacion_items.salida as cantidad',
            'liquidacion_items.costo_unitario as precio_unitario',
            'liquidacion_items.total'
        )->get();

        // Obtener nombre del cliente si se especificó RUC
        $clienteNombre = 'Todos los clientes';
        if ($request->empresa_ruc && $items->isNotEmpty()) {
            $clienteNombre = $items->first()->proveedor ?? 'Cliente Desconocido';
        }

        $reporte = [
            'empresa_ruc' => $request->empresa_ruc ?? 'Todos',
            'empresa_nombre' => $clienteNombre,
            'proveedor' => $request->proveedor ?? 'Todos',
            'cantidad_total' => $items->sum('cantidad'),
            'monto_total' => $items->sum('total'),
            'periodo_inicio' => $request->fecha_inicio,
            'periodo_fin' => $request->fecha_fin,
            'items' => $items,
        ];

        return response()->json(['content' => $reporte]);
    }

    /**
     * Reporte de Compras (Ingresos) por Proveedor en un periodo
     * Las compras son los INGRESOS de inventario desde proveedores
     */
    public function reporteCompras(Request $request)
    {
        $request->validate([
            'empresa_matriz_id' => 'nullable|integer',
            'empresa_ruc' => 'nullable|string',
            'proveedor' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
        ]);

        $query = DB::table('liquidacion_items')
            ->join('liquidaciones', 'liquidacion_items.liquidacion_id', '=', 'liquidaciones.id')
            ->where('liquidacion_items.ingreso', '>', 0) // Solo ingresos (compras)
            ->whereBetween(DB::raw('STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")'), [$request->fecha_inicio, $request->fecha_fin]);

        // Filtrar por empresa matriz (RUC de la liquidación)
        if ($request->empresa_matriz_id) {
            // Primero intentar obtener el RUC de la tabla empresas
            $empresaMatriz = DB::table('empresas')->where('id', $request->empresa_matriz_id)->first();
            
            if ($empresaMatriz) {
                $query->where('liquidaciones.numero_documento', $empresaMatriz->ruc);
            } else {
                // Si no existe en empresas, obtener el RUC basado en la posición en liquidaciones
                $liquidacionesUnicas = DB::table('liquidaciones')
                    ->select('numero_documento')
                    ->distinct()
                    ->orderBy('numero_documento')
                    ->get();
                
                // El ID corresponde al índice + 1 en la lista ordenada
                if (isset($liquidacionesUnicas[$request->empresa_matriz_id - 1])) {
                    $ruc = $liquidacionesUnicas[$request->empresa_matriz_id - 1]->numero_documento;
                    $query->where('liquidaciones.numero_documento', $ruc);
                }
            }
        }

        // Filtrar por nombre de proveedor
        if ($request->proveedor) {
            $query->where('liquidacion_items.proveedor', 'LIKE', '%' . $request->proveedor . '%');
        }

        // Filtrar por RUC del proveedor
        if ($request->empresa_ruc) {
            $query->where('liquidacion_items.ruc_dni', $request->empresa_ruc);
        }

        $items = $query->select(
            'liquidacion_items.fecha',
            'liquidacion_items.kardex',
            'liquidacion_items.descripcion',
            'liquidacion_items.proveedor',
            'liquidacion_items.ruc_dni',
            'liquidacion_items.ingreso as cantidad',
            'liquidacion_items.costo_unitario as precio_unitario',
            'liquidacion_items.total'
        )->get();

        // Obtener nombre del proveedor si se especificó RUC
        $proveedorNombre = 'Todos los proveedores';
        if ($request->empresa_ruc && $items->isNotEmpty()) {
            $proveedorNombre = $items->first()->proveedor ?? 'Proveedor Desconocido';
        }

        $reporte = [
            'empresa_ruc' => $request->empresa_ruc ?? 'Todos',
            'empresa_nombre' => $proveedorNombre,
            'proveedor' => $request->proveedor ?? 'Todos',
            'cantidad_total' => $items->sum('cantidad'),
            'monto_total' => $items->sum('total'),
            'periodo_inicio' => $request->fecha_inicio,
            'periodo_fin' => $request->fecha_fin,
            'items' => $items,
        ];

        return response()->json(['content' => $reporte]);
    }

    /**
     * Comportamiento de Precios por Año/Mes
     */
    public function comportamientoPrecios(Request $request)
    {
        $request->validate([
            'empresa_matriz_id' => 'nullable|integer',
            'kardex' => 'nullable|string',
            'anio' => 'required|integer|min:2020|max:2100',
            'mes_inicio' => 'nullable|integer|min:1|max:12',
            'mes_fin' => 'nullable|integer|min:1|max:12',
        ]);

        $query = DB::table('liquidacion_items')
            ->join('liquidaciones', 'liquidacion_items.liquidacion_id', '=', 'liquidaciones.id')
            ->select(
                DB::raw('YEAR(STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")) as anio'),
                DB::raw('MONTH(STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")) as mes'),
                'liquidacion_items.kardex',
                'liquidacion_items.descripcion',
                DB::raw('AVG(CASE WHEN liquidacion_items.ingreso > 0 THEN liquidacion_items.costo_unitario ELSE NULL END) as precio_compra_promedio'),
                DB::raw('AVG(CASE WHEN liquidacion_items.salida > 0 THEN liquidacion_items.costo_unitario ELSE NULL END) as precio_venta_promedio'),
                DB::raw('SUM(liquidacion_items.ingreso) as cantidad_comprada'),
                DB::raw('SUM(liquidacion_items.salida) as cantidad_vendida')
            )
            ->whereRaw('YEAR(STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")) = ?', [$request->anio]);

        // Filtrar por empresa matriz (RUC de la liquidación)
        if ($request->empresa_matriz_id) {
            // Primero intentar obtener el RUC de la tabla empresas
            $empresaMatriz = DB::table('empresas')->where('id', $request->empresa_matriz_id)->first();
            
            if ($empresaMatriz) {
                $query->where('liquidaciones.numero_documento', $empresaMatriz->ruc);
            } else {
                // Si no existe en empresas, obtener el RUC basado en la posición en liquidaciones
                $liquidacionesUnicas = DB::table('liquidaciones')
                    ->select('numero_documento')
                    ->distinct()
                    ->orderBy('numero_documento')
                    ->get();
                
                // El ID corresponde al índice + 1 en la lista ordenada
                if (isset($liquidacionesUnicas[$request->empresa_matriz_id - 1])) {
                    $ruc = $liquidacionesUnicas[$request->empresa_matriz_id - 1]->numero_documento;
                    $query->where('liquidaciones.numero_documento', $ruc);
                }
            }
        }

        if ($request->kardex) {
            $query->where('liquidacion_items.kardex', $request->kardex);
        }

        if ($request->mes_inicio && $request->mes_fin) {
            $query->whereRaw('MONTH(STR_TO_DATE(liquidacion_items.fecha, "%d/%m/%Y")) BETWEEN ? AND ?', [$request->mes_inicio, $request->mes_fin]);
        }

        $datos = $query->groupBy('anio', 'mes', 'liquidacion_items.kardex', 'liquidacion_items.descripcion')
            ->orderBy('anio', 'desc')
            ->orderBy('mes', 'desc')
            ->orderBy('liquidacion_items.kardex')
            ->get();

        // Calcular variaciones respecto al mes anterior
        $datosConVariacion = [];
        $preciosAnteriores = [];

        foreach ($datos as $dato) {
            $key = $dato->kardex . '-' . $dato->anio . '-' . $dato->mes;
            $mesAnterior = $dato->mes - 1;
            $anioAnterior = $dato->anio;
            
            if ($mesAnterior < 1) {
                $mesAnterior = 12;
                $anioAnterior--;
            }

            $keyAnterior = $dato->kardex . '-' . $anioAnterior . '-' . $mesAnterior;

            $variacionCompra = 0;
            $variacionVenta = 0;

            if (isset($preciosAnteriores[$keyAnterior])) {
                $anterior = $preciosAnteriores[$keyAnterior];
                
                if ($anterior['compra'] > 0 && $dato->precio_compra_promedio > 0) {
                    $variacionCompra = (($dato->precio_compra_promedio - $anterior['compra']) / $anterior['compra']) * 100;
                }
                
                if ($anterior['venta'] > 0 && $dato->precio_venta_promedio > 0) {
                    $variacionVenta = (($dato->precio_venta_promedio - $anterior['venta']) / $anterior['venta']) * 100;
                }
            }

            $preciosAnteriores[$key] = [
                'compra' => $dato->precio_compra_promedio ?? 0,
                'venta' => $dato->precio_venta_promedio ?? 0,
            ];

            $datosConVariacion[] = [
                'kardex' => $dato->kardex,
                'descripcion' => $dato->descripcion,
                'anio' => (int)$dato->anio,
                'mes' => (int)$dato->mes,
                'precio_compra_promedio' => round($dato->precio_compra_promedio ?? 0, 2),
                'precio_venta_promedio' => round($dato->precio_venta_promedio ?? 0, 2),
                'cantidad_comprada' => (int)$dato->cantidad_comprada,
                'cantidad_vendida' => (int)$dato->cantidad_vendida,
                'variacion_compra' => round($variacionCompra, 2),
                'variacion_venta' => round($variacionVenta, 2),
            ];
        }

        return response()->json(['content' => $datosConVariacion]);
    }

    /**
     * Obtener lista de clientes con RUC únicos (solo de registros con salidas)
     */
    public function getClientes()
    {
        $clientes = DB::table('liquidacion_items')
            ->select(
                'ruc_dni as ruc',
                DB::raw('MAX(proveedor) as nombre')
            )
            ->where('salida', '>', 0) // Solo registros con salidas
            ->whereNotNull('ruc_dni')
            ->where('ruc_dni', '!=', '')
            ->groupBy('ruc_dni')
            ->orderBy('nombre')
            ->get();

        return response()->json(['content' => $clientes]);
    }

    /**
     * Obtener lista de proveedores con RUC únicos (solo de registros con ingresos)
     */
    public function getProveedores()
    {
        $proveedores = DB::table('liquidacion_items')
            ->select(
                'ruc_dni as ruc',
                DB::raw('MAX(proveedor) as nombre')
            )
            ->where('ingreso', '>', 0) // Solo registros con ingresos
            ->whereNotNull('ruc_dni')
            ->where('ruc_dni', '!=', '')
            ->groupBy('ruc_dni')
            ->orderBy('nombre')
            ->get();

        return response()->json(['content' => $proveedores]);
    }

    /**
     * Obtener lista de kardex únicos
     */
    public function getKardexList()
    {
        $kardex = DB::table('liquidacion_items')
            ->select('kardex', 'descripcion')
            ->whereNotNull('kardex')
            ->where('kardex', '!=', '')
            ->groupBy('kardex', 'descripcion')
            ->orderBy('kardex')
            ->get();

        return response()->json(['content' => $kardex]);
    }

    /**
     * Obtener lista de empresas matriz (las que registran liquidaciones)
     */
    public function getEmpresasMatriz()
    {
        // Primero intentar obtener empresas de la tabla empresas que coincidan con liquidaciones
        $empresasConNombre = DB::table('liquidaciones')
            ->join('empresas', 'liquidaciones.numero_documento', '=', 'empresas.ruc')
            ->select('empresas.id', 'empresas.nombre', 'empresas.ruc')
            ->distinct()
            ->get();

        // Obtener todos los RUCs únicos de liquidaciones
        $rucsDeLiquidaciones = DB::table('liquidaciones')
            ->select('numero_documento')
            ->distinct()
            ->pluck('numero_documento');

        // Crear una lista completa, usando nombres de la tabla empresas cuando estén disponibles
        $empresasCompletas = [];
        $idCounter = 1;

        foreach ($rucsDeLiquidaciones as $ruc) {
            // Buscar si existe en la tabla empresas
            $empresaConNombre = $empresasConNombre->firstWhere('ruc', $ruc);
            
            if ($empresaConNombre) {
                $empresasCompletas[] = [
                    'id' => $empresaConNombre->id,
                    'nombre' => $empresaConNombre->nombre,
                    'ruc' => $empresaConNombre->ruc
                ];
            } else {
                // Si no existe en empresas, crear una entrada temporal
                $empresasCompletas[] = [
                    'id' => $idCounter++,
                    'nombre' => "Empresa RUC: {$ruc}",
                    'ruc' => $ruc
                ];
            }
        }

        // Ordenar por nombre
        usort($empresasCompletas, function($a, $b) {
            return strcmp($a['nombre'], $b['nombre']);
        });

        return response()->json(['content' => $empresasCompletas]);
    }
}
