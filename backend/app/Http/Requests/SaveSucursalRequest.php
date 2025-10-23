<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveSucursalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'regex:/^9\d{8}$/'],
            'email' => ['required', 'email', 'max:255', Rule::unique('sucursales')],
            'activo' => ['required', 'boolean'],
        ];

        if ($this->isMethod('PUT')) {
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('sucursales')->ignore($this->route('sucursal'))];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es requerido',
            'nombre.string' => 'El nombre debe ser un texto válido',
            'nombre.max' => 'El nombre no puede tener más de 255 caracteres',
            'direccion.required' => 'La dirección es requerida',
            'direccion.string' => 'La dirección debe ser un texto válido',
            'direccion.max' => 'La dirección no puede tener más de 255 caracteres',
            'telefono.required' => 'El teléfono es requerido',
            'telefono.string' => 'El teléfono debe ser un texto válido',
            'telefono.regex' => 'El teléfono debe ser un número de 9 dígitos que comience con 9',
            'email.required' => 'El email es requerido',
            'email.email' => 'El email debe ser un email válido',
            'email.max' => 'El email no puede tener más de 255 caracteres',
            'email.unique' => 'El email ya está en uso',
            'activo.boolean' => 'El campo activo debe ser un booleano',
            'activo.required' => 'El campo activo es requerido',
        ];
    }
}
