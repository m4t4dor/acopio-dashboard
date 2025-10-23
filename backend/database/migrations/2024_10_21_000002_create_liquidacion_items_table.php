<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liquidacion_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liquidacion_id')->constrained('liquidaciones')->onDelete('cascade');
            $table->string('kardex', 20);
            $table->string('fecha', 20);
            $table->string('proveedor', 255);
            $table->string('ruc_dni', 20);
            $table->decimal('ingreso', 10, 2)->default(0);
            $table->decimal('salida', 10, 2)->default(0);
            $table->decimal('costo_unitario', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liquidacion_items');
    }
};
