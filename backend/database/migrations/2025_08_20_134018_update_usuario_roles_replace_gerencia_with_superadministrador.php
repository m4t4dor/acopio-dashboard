<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar todos los usuarios que tienen rol 'GERENCIA' a 'SUPERADMINISTRADOR'
        DB::table('usuarios')
            ->where('rol', 'GERENCIA')
            ->update(['rol' => 'SUPERADMINISTRADOR']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir el cambio: actualizar todos los usuarios que tienen rol 'SUPERADMINISTRADOR' a 'GERENCIA'
        DB::table('usuarios')
            ->where('rol', 'SUPERADMINISTRADOR')
            ->update(['rol' => 'GERENCIA']);
    }
};
