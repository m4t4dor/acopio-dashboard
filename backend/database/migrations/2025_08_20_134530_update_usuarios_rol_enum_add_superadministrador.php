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
        // Actualizar el ENUM de la columna rol para reemplazar GERENCIA con SUPERADMINISTRADOR
        DB::statement("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('SUPERADMINISTRADOR','ADMINISTRADOR','SUPERVISOR','ASISTENTE') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir el cambio: volver al ENUM original
        DB::statement("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('GERENCIA','ADMINISTRADOR','SUPERVISOR','ASISTENTE') NOT NULL");
    }
};
