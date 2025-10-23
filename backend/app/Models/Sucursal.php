<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sucursales';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'email',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    protected $appends = [
        'activo_str',
    ];

    public function getActivoStrAttribute(): string
    {
        return $this->activo ? 'ACTIVO' : 'INACTIVO';
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
