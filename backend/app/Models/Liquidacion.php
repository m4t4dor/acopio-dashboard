<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Liquidacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'liquidaciones';

    protected $fillable = [
        'numero_documento',
        'fecha_procesamiento',
        'nombre_archivo',
        'total_items',
        'total_general',
        'estado',
        'usuario_id',
    ];

    protected $casts = [
        'fecha_procesamiento' => 'datetime',
        'total_general' => 'decimal:2',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(LiquidacionItem::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
