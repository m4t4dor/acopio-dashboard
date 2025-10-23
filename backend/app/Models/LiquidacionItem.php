<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiquidacionItem extends Model
{
    use HasFactory;

    protected $table = 'liquidacion_items';

    protected $fillable = [
        'liquidacion_id',
        'kardex',
        'descripcion',
        'fecha',
        'proveedor',
        'ruc_dni',
        'ingreso',
        'salida',
        'costo_unitario',
        'total',
    ];

    protected $casts = [
        'ingreso' => 'decimal:2',
        'salida' => 'decimal:2',
        'costo_unitario' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function liquidacion(): BelongsTo
    {
        return $this->belongsTo(Liquidacion::class);
    }
}
