import { EUsuarioRolValues } from "./enums"

export type TUsuario = {
	id: number
	nombre_completo: string
	direccion: string
	telefono: string
	email: string
	username: string
	password: string
	rol: EUsuarioRolValues
	activo: boolean
	activo_str: string
    es_rol_super_administrador: boolean
    es_rol_administrador: boolean
    es_rol_supervisor: boolean
    es_rol_asistente: boolean
	sucursal_id: number | null
	created_at: string
	updated_at: string | null
	deleted_at: string | null
	sucursal?: TSucursal | null
}

export type TUsuariosConPaginacion = TLaravelPagination<TUsuario>

export type TSucursal = {
	id: number
	nombre: string
	direccion: string
	telefono: string
	email: string
	activo: boolean
	activo_str: string
	created_at: string
	updated_at: string | null
	deleted_at: string | null
}

export type TSucursalesConPaginacion = TLaravelPagination<TSucursal>

export type TCliente = {
	id: number
	documento_tipo: 'dni' | 'ruc' | 'carnet_extranjeria' | 'pasaporte'
	documento_numero: string
	nombres: string | null
	nombre_comercial: string | null
	telefono: string[] | null
	direccion: string | null
	sucursal_id: number
	nombre_mostrar: string
	documento_completo: string
	telefono_principal: string | null
	telefonos_alternativos: string[]
	created_at: string
	updated_at: string | null
	deleted_at: string | null
	sucursal?: TSucursal | null
}

export type TClientesConPaginacion = TLaravelPagination<TCliente>

export type TEmpresa = {
	id: number
	ruc: string
	nombre: string
	telefono: string[] | null
	direccion: string | null
	created_at: string
	updated_at: string | null
}

export type TEmpresasConPaginacion = TLaravelPagination<TEmpresa>

// Tipos de liquidaciones
export type TItemLiquidacion = {
  id?: number
  kardex: string
  descripcion: string
  fecha: string
  proveedor: string
  ruc_dni: string
  ingreso: number
  salida: number
  costo_unitario: number
  total: number
}

export type TLiquidacion = {
  id?: number
  numero_documento: string
  fecha_procesamiento: Date
  nombre_archivo: string
  items: TItemLiquidacion[]
  total_items: number
  total_general: number
  estado: 'procesado' | 'pendiente' | 'error'
}

export type TLaravelPagination<T> = {
	current_page: number
	data: T[]
	first_page_url: string
	from: number
	last_page: number
	last_page_url: string
	links: {
		url: string | null
		label: string
		active: boolean
	}[]
	next_page_url: string | null
	path: string
	per_page: number
	prev_page_url: string | null
	to: number
	total: number
}