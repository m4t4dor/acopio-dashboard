export interface TReferencia {
  id?: number
  codigo_compra: string
  descripcion: string
  num_kardex: string
  activo: boolean
  created_at?: Date
  updated_at?: Date
}

export interface TReferenciaImportar {
  codigo_compra: string
  descripcion: string
  num_kardex: string
  activo?: boolean
}
