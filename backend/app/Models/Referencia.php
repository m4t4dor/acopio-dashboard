<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Referencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'referencias';

    protected $fillable = [
        'codigo_compra',
        'descripcion',
        'num_kardex',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Scope para obtener solo referencias activas
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Buscar referencia por código de compra
     */
    public static function buscarPorCodigo(string $codigoCompra): ?self
    {
        return self::where('codigo_compra', $codigoCompra)
            ->where('activo', true)
            ->first();
    }

    /**
     * Buscar referencia por descripción (búsqueda parcial)
     */
    public static function buscarPorDescripcion(string $descripcion): ?self
    {
        $descripcionLimpia = trim(strtoupper($descripcion));
        
        return self::where('activo', true)
            ->whereRaw('UPPER(descripcion) LIKE ?', ["%{$descripcionLimpia}%"])
            ->first();
    }

    /**
     * Obtener kardex sugerido por código o descripción
     */
    public static function obtenerKardexSugerido(string $codigoODescripcion): ?string
    {
        // Primero buscar por código exacto
        $referencia = self::buscarPorCodigo($codigoODescripcion);
        
        // Si no encuentra, buscar por descripción
        if (!$referencia) {
            $referencia = self::buscarPorDescripcion($codigoODescripcion);
        }
        
        return $referencia?->num_kardex;
    }
}
