<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'documento_tipo' => ['required', 'in:dni,ruc,carnet_extranjeria,pasaporte'],
            'documento_numero' => ['required', 'string', 'max:20'],
            'nombres' => ['nullable', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'array'],
            'telefono.*' => ['nullable', 'string', 'regex:/^9\d{8}$/', 'distinct'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'sucursal_id' => ['required', 'integer', 'exists:sucursales,id'],
        ];

        // Validación condicional: si es DNI requiere nombres, si es RUC requiere nombre_comercial
        if ($this->documento_tipo === 'dni') {
            $rules['nombres'][] = 'required';
        }
        
        if ($this->documento_tipo === 'ruc') {
            $rules['nombre_comercial'][] = 'required';
        }

        if ($this->isMethod('POST')) {
            $rules['documento_numero'][] = Rule::unique('clientes')->where(function ($query) {
                return $query->where('documento_tipo', $this->documento_tipo)
                    ->where('sucursal_id', $this->sucursal_id);
            });
        }

        if ($this->isMethod('PUT')) {
            $rules['documento_numero'][] = Rule::unique('clientes')->where(function ($query) {
                return $query->where('documento_tipo', $this->documento_tipo)
                    ->where('sucursal_id', $this->sucursal_id);
            })->ignore($this->route('cliente'));
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'documento_tipo.required' => 'El tipo de documento es requerido',
            'documento_tipo.in' => 'El tipo de documento debe ser DNI, RUC, Carnet de Extranjería o Pasaporte',
            'documento_numero.required' => 'El número de documento es requerido',
            'documento_numero.string' => 'El número de documento debe ser un texto válido',
            'documento_numero.max' => 'El número de documento no puede tener más de 20 caracteres',
            'documento_numero.unique' => 'Ya existe un cliente con este tipo y número de documento en esta sucursal',
            'nombres.required' => 'Los nombres son requeridos para tipo de documento DNI',
            'nombres.string' => 'Los nombres deben ser un texto válido',
            'nombres.max' => 'Los nombres no pueden tener más de 255 caracteres',
            'nombre_comercial.required' => 'El nombre comercial es requerido para tipo de documento RUC',
            'nombre_comercial.string' => 'El nombre comercial debe ser un texto válido',
            'nombre_comercial.max' => 'El nombre comercial no puede tener más de 255 caracteres',
            'direccion.string' => 'La dirección debe ser un texto válido',
            'direccion.max' => 'La dirección no puede tener más de 255 caracteres',
            'telefono.array' => 'Los teléfonos deben ser una lista válida',
            'telefono.*.string' => 'Cada teléfono debe ser un texto válido',
            'telefono.*.regex' => 'Cada teléfono debe ser un número de 9 dígitos que comience con 9',
            'telefono.*.distinct' => 'No se pueden repetir los números de teléfono',
            'sucursal_id.required' => 'La sucursal es requerida',
            'sucursal_id.integer' => 'La sucursal debe ser un número válido',
            'sucursal_id.exists' => 'La sucursal seleccionada no existe',
        ];
    }
}
