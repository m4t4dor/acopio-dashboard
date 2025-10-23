<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clientes';

    protected $fillable = [
        'documento_tipo',
        'documento_numero',
        'nombres',
        'nombre_comercial',
        'telefono',
        'direccion',
        'sucursal_id',
    ];

    protected $casts = [
        'telefono' => 'array',
    ];

    protected $appends = [
        'nombre_mostrar',
        'documento_completo',
        'telefono_principal',
        'telefonos_alternativos',
    ];

    public function getNombreMostrarAttribute(): string
    {
        // Si es RUC, mostrar nombre_comercial, sino mostrar nombres
        if ($this->documento_tipo === 'ruc') {
            return $this->nombre_comercial ?? 'Sin nombre';
        }
        return $this->nombres ?? 'Sin nombre';
    }

    public function getDocumentoCompletoAttribute(): string
    {
        return strtoupper($this->documento_tipo) . ': ' . $this->documento_numero;
    }

    public function getTelefonoPrincipalAttribute(): ?string
    {
        $telefonos = $this->telefono;
        return is_array($telefonos) && !empty($telefonos) ? $telefonos[0] : null;
    }

    public function getTelefonosAlternativosAttribute(): array
    {
        $telefonos = $this->telefono;
        if (!is_array($telefonos) || count($telefonos) <= 1) {
            return [];
        }
        return array_slice($telefonos, 1);
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function prestamos()
    {
        return $this->hasMany(Prestamo::class, 'cliente_id');
    }
}
