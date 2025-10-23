<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Agregar RUC al enum de documento_tipo si no existe
            $table->dropColumn([
                'apellidos',
                'fecha_nacimiento',
                'genero',
                'correo_electronico',
                'nivel'
            ]);
            
            // Agregar columna nombre_comercial
            $table->string('nombre_comercial', 255)->nullable()->after('documento_numero');
            
            // Modificar nombres para que sea nullable
            $table->string('nombres', 255)->nullable()->change();
        });
        
        // Actualizar el enum de documento_tipo para incluir 'ruc'
        DB::statement("ALTER TABLE `clientes` MODIFY `documento_tipo` ENUM('dni','ruc','carnet_extranjeria','pasaporte') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Restaurar columnas eliminadas
            $table->string('apellidos', 255)->nullable()->after('nombres');
            $table->date('fecha_nacimiento')->nullable()->after('apellidos');
            $table->enum('genero', ['masculino', 'femenino', 'otro'])->nullable()->after('fecha_nacimiento');
            $table->string('correo_electronico', 255)->nullable();
            $table->enum('nivel', ['normal', 'preferente', 'vip'])->default('normal')->after('telefono');
            
            // Eliminar nombre_comercial
            $table->dropColumn('nombre_comercial');
            
            // Modificar nombres para que sea NOT NULL
            $table->string('nombres', 255)->nullable(false)->change();
        });
        
        // Restaurar el enum de documento_tipo sin 'ruc'
        DB::statement("ALTER TABLE `clientes` MODIFY `documento_tipo` ENUM('dni','carnet_extranjeria','pasaporte') NOT NULL");
    }
};
