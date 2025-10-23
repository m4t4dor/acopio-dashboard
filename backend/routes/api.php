<?php

use App\Http\Controllers\AutenticacionController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\SucursalController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\DniRucController;
use App\Http\Controllers\LiquidacionController;
use App\Http\Controllers\ReferenciaController;
use App\Http\Controllers\ReporteController;
use Illuminate\Support\Facades\Route;

Route::prefix('panel-de-administracion')->group(function () {
    // Autenticación
    Route::post('autenticacion/iniciar-sesion', [AutenticacionController::class, 'iniciarSesion']);

    // Solo usuarios autenticados
    Route::middleware(['auth:sanctum', 'verificar.usuario.activo'])->group(function () {

        Route::post('autenticacion/cerrar-sesion', [AutenticacionController::class, 'cerrarSesion']);
        Route::get('autenticacion/usuario', [AutenticacionController::class, 'usuario']);
        Route::put('autenticacion/usuario/sucursal', [AutenticacionController::class, 'cambiarSucursal']);
        Route::put('autenticacion/cambiar-password', [AutenticacionController::class, 'cambiarPassword']);

        // DNI/RUC search
        Route::get('dniruc', [DniRucController::class, 'buscarPorDocumento']);

        // Usuarios
        Route::get('usuarios/create', [UsuarioController::class, 'create']);
        Route::get('usuarios/{usuario}/edit', [UsuarioController::class, 'edit']);
        Route::apiResource('usuarios', UsuarioController::class);

        // Sucursales
        Route::get('sucursales/create', [SucursalController::class, 'create']);
        Route::get('sucursales/{sucursal}/edit', [SucursalController::class, 'edit']);
        Route::apiResource('sucursales', SucursalController::class)->parameter('sucursales', 'sucursal');

        // Clientes
        Route::get('clientes/create', [ClienteController::class, 'create']);
        Route::get('clientes/{cliente}/edit', [ClienteController::class, 'edit']);
        Route::get('clientes', [ClienteController::class, 'index']);
        Route::get('clientes/{cliente}', [ClienteController::class, 'show']);
        Route::middleware('no_es_asistente')->group(function () {
            Route::post('clientes', [ClienteController::class, 'store']);
            Route::put('clientes/{cliente}', [ClienteController::class, 'update']);
            Route::patch('clientes/{cliente}', [ClienteController::class, 'update']);
            Route::delete('clientes/{cliente}', [ClienteController::class, 'destroy']);
        });

        // Empresas
        Route::get('empresas', [EmpresaController::class, 'index']);
        Route::get('empresas/{empresa}', [EmpresaController::class, 'show']);
        Route::post('empresas', [EmpresaController::class, 'store']);
        Route::put('empresas/{empresa}', [EmpresaController::class, 'update']);
        Route::delete('empresas/{empresa}', [EmpresaController::class, 'destroy']);

        // Liquidaciones
        Route::get('liquidaciones', [LiquidacionController::class, 'index']);
        Route::get('liquidaciones/{id}', [LiquidacionController::class, 'show']);
        Route::post('liquidaciones', [LiquidacionController::class, 'store']);
        Route::put('liquidaciones/{id}', [LiquidacionController::class, 'update']);
        Route::delete('liquidaciones/{id}', [LiquidacionController::class, 'destroy']);
        Route::post('liquidaciones/procesar-pdf', [LiquidacionController::class, 'procesarPDF']);

        // Referencias
        Route::get('referencias', [ReferenciaController::class, 'index']);
        Route::get('referencias/{id}', [ReferenciaController::class, 'show']);
        Route::post('referencias', [ReferenciaController::class, 'store']);
        Route::put('referencias/{id}', [ReferenciaController::class, 'update']);
        Route::delete('referencias/{id}', [ReferenciaController::class, 'destroy']);
        Route::post('referencias/buscar-kardex', [ReferenciaController::class, 'buscarKardex']);
        Route::patch('referencias/{id}/toggle-activo', [ReferenciaController::class, 'toggleActivo']);
        Route::post('referencias/importar', [ReferenciaController::class, 'importar']);

        // Reportes
        Route::post('reportes/ventas', [ReporteController::class, 'reporteVentas']);
        Route::post('reportes/compras', [ReporteController::class, 'reporteCompras']);
        Route::post('reportes/comportamiento-precios', [ReporteController::class, 'comportamientoPrecios']);
        Route::get('reportes/clientes', [ReporteController::class, 'getClientes']);
        Route::get('reportes/proveedores', [ReporteController::class, 'getProveedores']);
        Route::get('reportes/kardex', [ReporteController::class, 'getKardexList']);
        Route::get('reportes/empresas-matriz', [ReporteController::class, 'getEmpresasMatriz']);
        
    });
});
