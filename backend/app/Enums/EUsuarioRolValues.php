<?php

namespace App\Enums;

enum EUsuarioRolValues: string
{
    use EnumHelper;
    case SUPERADMINISTRADOR = 'SUPERADMINISTRADOR';
    case ADMINISTRADOR = 'ADMINISTRADOR';
    case SUPERVISOR = 'SUPERVISOR';
    case ASISTENTE = 'ASISTENTE';
}
