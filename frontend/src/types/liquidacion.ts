export interface TItemLiquidacion {
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
  tipo?: 'ingreso' | 'salida' // Para diferenciar ingresos de salidas
}

export interface TLiquidacion {
  id?: number
  numero_documento: string
  fecha_procesamiento: Date
  nombre_archivo: string
  items: TItemLiquidacion[]
  total_items: number
  total_general: number
  estado: 'procesado' | 'pendiente' | 'error'
}

export interface TProcesarPDFResponse {
  success: boolean
  data: TLiquidacion
  message?: string
}

// Interface para el cálculo de saldos por kardex
export interface TSaldoKardex {
  kardex: string
  descripcion: string
  total_ingreso: number
  total_salida: number
  saldo_pendiente: number
  costo_promedio: number
}
