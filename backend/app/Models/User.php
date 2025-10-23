<?php

namespace App\Models;

use App\Enums\EUsuarioRolValues;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre_completo',
        'direccion',
        'telefono',
        'email',
        'username',
        'password',
        'rol',
        'activo',
        'sucursal_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'hashed',
        'acciones' => 'array',
        'activo' => 'boolean',
    ];

    protected $appends = [
        'activo_str',
        'es_rol_super_administrador',
        'es_rol_administrador',
        'es_rol_supervisor',
        'es_rol_asistente',
    ];

    public function getActivoStrAttribute(): string
    {
        return $this->activo ? 'ACTIVO' : 'INACTIVO';
    }

    public function getEsRolSuperAdministradorAttribute(): bool
    {
        return $this->esRolSuperAdministrador();
    }

    public function getEsRolAdministradorAttribute(): bool
    {
        return $this->esRolAdministrador();
    }

    public function getEsRolSupervisorAttribute(): bool
    {
        return $this->esRolSupervisor();
    }

    public function getEsRolAsistenteAttribute(): bool
    {
        return $this->esRolAsistente();
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function esRolSuperAdministrador(): bool
    {
        return $this->rol == EUsuarioRolValues::SUPERADMINISTRADOR->value;
    }

    public function esRolAdministrador(): bool
    {
        return $this->rol == EUsuarioRolValues::ADMINISTRADOR->value;
    }

    public function esRolAsistente(): bool
    {
        return $this->rol == EUsuarioRolValues::ASISTENTE->value;
    }

    public function esRolSupervisor(): bool
    {
        return $this->rol == EUsuarioRolValues::SUPERVISOR->value;
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class);
    }
}
