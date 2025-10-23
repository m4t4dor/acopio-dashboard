<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $empresaId = $this->route('empresa');

        $rules = [
            'ruc' => [
                'required',
                'string',
                'size:11',
                'regex:/^[0-9]{11}$/',
                'unique:empresas,ruc' . ($empresaId ? ',' . $empresaId : ''),
            ],
            'nombre' => ['required', 'string', 'max:255'],
            'telefono' => ['nullable', 'array'],
            'telefono.*' => ['string', 'regex:/^9\d{8}$/'],
            'direccion' => ['nullable', 'string', 'max:500'],
        ];

        return $rules;
    }

    public function messages(): array
    {
        return [
            'ruc.required' => 'El RUC es obligatorio.',
            'ruc.size' => 'El RUC debe tener 11 dígitos.',
            'ruc.regex' => 'El RUC debe contener solo números.',
            'ruc.unique' => 'Este RUC ya está registrado.',
            'nombre.required' => 'El nombre de la empresa es obligatorio.',
            'nombre.max' => 'El nombre no puede exceder 255 caracteres.',
            'telefono.*.regex' => 'El teléfono debe tener el formato 9XXXXXXXX.',
            'direccion.max' => 'La dirección no puede exceder 500 caracteres.',
        ];
    }
}
