<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liquidaciones', function (Blueprint $table) {
            $table->id();
            $table->string('numero_documento', 50);
            $table->timestamp('fecha_procesamiento');
            $table->string('nombre_archivo', 255);
            $table->integer('total_items')->default(0);
            $table->decimal('total_general', 10, 2)->default(0);
            $table->enum('estado', ['procesado', 'pendiente', 'error'])->default('procesado');
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liquidaciones');
    }
};
