<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Sucursal;
use App\Enums\EUsuarioRolValues;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear sucursal principal
        $sucursal = Sucursal::create([
            'nombre' => 'Tocache',
            'direccion' => 'Tocache, Perú',
            'telefono' => '999999999',
            'email' => 'tocache@empresa.com',
            'activo' => true,
        ]);

        // Crear usuario administrador
        User::create([
            'nombre_completo' => 'Administrador del Sistema',
            'direccion' => 'Tocache, Perú',
            'telefono' => '999999999',
            'email' => 'admin@empresa.com',
            'username' => 'admin',
            'password' => 'admin123',
            'rol' => EUsuarioRolValues::SUPERADMINISTRADOR->value,
            'activo' => true,
            'sucursal_id' => $sucursal->id,
        ]);
    }
}
