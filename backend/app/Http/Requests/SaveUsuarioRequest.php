<?php

namespace App\Http\Requests;

use App\Enums\EUsuarioRolValues;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'nombre_completo' => ['required', 'string', 'max:255'],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'regex:/^9\d{8}$/'],
            'email' => ['required', 'email', 'max:255', Rule::unique('usuarios')],
            'username' => ['required', 'max:20', 'regex:/^[a-zA-Z0-9_]+$/i', Rule::unique('usuarios')],
            'password' => ['required', 'min:6', 'confirmed'],
            'rol' => ['required', 'in:' . implode(',', EUsuarioRolValues::getValues())],
            'activo' => ['required', 'boolean'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
        ];

        if ($this->isMethod('PUT')) {
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('usuarios')->ignore($this->route('usuario'))];
            $rules['username'] = ['required', 'max:20', 'regex:/^[a-zA-Z0-9_]+$/i', Rule::unique('usuarios')->ignore($this->route('usuario'))];
            $rules['password'] = ['nullable', 'min:6', 'confirmed'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required' => 'El nombre completo es requerido',
            'nombre_completo.string' => 'El nombre completo debe ser un texto válido',
            'nombre_completo.max' => 'El nombre completo no puede tener más de 255 caracteres',
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
            'username.required' => 'El nombre de usuario es requerido',
            'username.max' => 'El nombre de usuario no puede tener más de 20 caracteres',
            'username.regex' => 'El nombre de usuario solo puede contener letras, números y guiones bajos',
            'username.unique' => 'El nombre de usuario ya está en uso',
            'password.required' => 'La contraseña es requerida',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
            'password.confirmed' => 'Las contraseñas no coinciden',
            'rol.required' => 'El rol es requerido',
            'rol.in' => 'El rol seleccionado no es válido',
            'activo.boolean' => 'El campo activo debe ser un booleano',
            'activo.required' => 'El campo activo es requerido',
            'sucursal_id.exists' => 'La sucursal seleccionada no es válida',
        ];
    }
}
