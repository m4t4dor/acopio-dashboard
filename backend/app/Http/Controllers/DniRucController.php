<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DniRucController extends Controller
{
    public function buscarPorDocumento(Request $request)
    {
        $request->validate([
            'documento_tipo' => 'required|in:dni,ruc',
            'documento_numero' => 'required|string'
        ]);

        $documentoTipo = $request->get('documento_tipo');
        $documentoNumero = $request->get('documento_numero');

        try {
            if ($documentoTipo === 'dni') {
                return $this->buscarDni($documentoNumero);
            } elseif ($documentoTipo === 'ruc') {
                return $this->buscarRuc($documentoNumero);
            }

            return response()->json([
                'content' => [
                    'error' => 'Tipo de documento no válido'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'content' => [
                    'error' => 'Error al consultar la información del documento'
                ]
            ]);
        }
    }

    private function buscarDni($documentoNumero)
    {
        $token = env('APISNETPE_TOKEN');
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json'
        ])->get('https://api.decolecta.com/v1/reniec/dni', [
            'numero' => $documentoNumero
        ]);

        if ($response->successful()) {
            $data = $response->json();
            
            return response()->json([
                'content' => [
                    'nombres' => $data['first_name'] ?? '',
                    'apellidoPaterno' => $data['first_last_name'] ?? '',
                    'apellidoMaterno' => $data['second_last_name'] ?? ''
                ]
            ]);
        } else {
            return response()->json([
                'content' => [
                    'error' => 'No se pudo encontrar información para el DNI proporcionado'
                ]
            ]);
        }
    }

    private function buscarRuc($documentoNumero)
    {
        $token = env('APISNETPE_TOKEN');
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json'
        ])->get('https://api.decolecta.com/v1/sunat/ruc/full', [
            'numero' => $documentoNumero
        ]);

        if ($response->successful()) {
            $data = $response->json();
            
            return response()->json([
                'content' => [
                    'razon_social' => $data['razon_social'] ?? '',
                    'nombre_comercial' => $data['razon_social'] ?? '', // Se llena con razon_social por defecto
                    'estado' => $data['estado'] ?? '',
                    'direccion' => $data['direccion'] ?? '',
                    'distrito' => $data['distrito'] ?? '',
                    'provincia' => $data['provincia'] ?? '',
                    'departamento' => $data['departamento'] ?? '',
                    'ubigeo' => $data['ubigeo'] ?? '',
                    'actividad_economica' => $data['actividad_economica'] ?? ''
                ]
            ]);
        } else {
            return response()->json([
                'content' => [
                    'error' => 'No se pudo encontrar información para el RUC proporcionado'
                ]
            ]);
        }
    }
}
