<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('liquidacion_items', function (Blueprint $table) {
            $table->text('descripcion')->nullable()->after('kardex');
        });
    }

    public function down(): void
    {
        Schema::table('liquidacion_items', function (Blueprint $table) {
            $table->dropColumn('descripcion');
        });
    }
};
