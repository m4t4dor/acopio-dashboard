// Tipos para Reportes

export type TReporteVentas = {
  empresa_ruc: string
  empresa_nombre: string
  cantidad_total: number
  monto_total: number
  periodo_inicio: string
  periodo_fin: string
  items: TDetalleVenta[]
}

export type TDetalleVenta = {
  fecha: string
  kardex: string
  descripcion: string
  proveedor: string
  ruc_dni: string
  cantidad: number
  precio_unitario: number
  total: number
}

export type TReporteCompras = {
  empresa_ruc: string
  empresa_nombre: string
  cantidad_total: number
  monto_total: number
  periodo_inicio: string
  periodo_fin: string
  items: TDetalleCompra[]
}

export type TDetalleCompra = {
  fecha: string
  kardex: string
  descripcion: string
  proveedor: string
  ruc_dni: string
  cantidad: number
  precio_unitario: number
  total: number
}

export type TComportamientoPrecios = {
  kardex: string
  descripcion: string
  anio: number
  mes: number
  precio_compra_promedio: number
  precio_venta_promedio: number
  cantidad_comprada: number
  cantidad_vendida: number
  variacion_compra: number
  variacion_venta: number
}

export type TFiltrosReporteVentas = {
  empresa_matriz_id?: number
  empresa_ruc?: string
  fecha_inicio: string
  fecha_fin: string
}

export type TFiltrosReporteCompras = {
  empresa_matriz_id?: number
  empresa_ruc?: string
  fecha_inicio: string
  fecha_fin: string
}

export type TFiltrosComportamientoPrecios = {
  empresa_matriz_id?: number
  kardex?: string
  anio?: number
  mes_inicio?: number
  mes_fin?: number
}
