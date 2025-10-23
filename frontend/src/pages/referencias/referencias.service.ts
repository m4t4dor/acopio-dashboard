import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TReferencia, TReferenciaImportar } from "@/types/referencia"

type TGetReferenciasParams = {
  activo?: boolean
  buscar?: string
}

type TGetReferenciasResponse = {
  content: TReferencia[]
}

export const getReferencias = async (params?: TGetReferenciasParams): AxiosPromise<TGetReferenciasResponse> => {
  return axiosInstance.get("/referencias", { params })
}

type TGetReferenciaResponse = {
  content: TReferencia
}

export const getReferencia = async (id: number): AxiosPromise<TGetReferenciaResponse> => {
  return axiosInstance.get(`/referencias/${id}`)
}

type TStoreReferenciaResponse = {
  message: string
  content: {
    referencia: TReferencia
  }
}

export const storeReferencia = async (data: Omit<TReferencia, "id">): AxiosPromise<TStoreReferenciaResponse> => {
  return axiosInstance.post("/referencias", data)
}

type TUpdateReferenciaResponse = {
  message: string
  content: {
    referencia: TReferencia
  }
}

export const updateReferencia = async (id: number, data: Partial<TReferencia>): AxiosPromise<TUpdateReferenciaResponse> => {
  return axiosInstance.put(`/referencias/${id}`, data)
}

type TDeleteReferenciaResponse = {
  message: string
}

export const deleteReferencia = async (id: number): AxiosPromise<TDeleteReferenciaResponse> => {
  return axiosInstance.delete(`/referencias/${id}`)
}

type TBuscarKardexResponse = {
  content: {
    encontrado: boolean
    num_kardex: string | null
  }
}

export const buscarKardex = async (codigoDescripcion: string): AxiosPromise<TBuscarKardexResponse> => {
  return axiosInstance.post("/referencias/buscar-kardex", {
    codigo_descripcion: codigoDescripcion,
  })
}

type TToggleActivoResponse = {
  message: string
  content: {
    referencia: TReferencia
  }
}

export const toggleActivo = async (id: number): AxiosPromise<TToggleActivoResponse> => {
  return axiosInstance.patch(`/referencias/${id}/toggle-activo`)
}

type TImportarReferenciasResponse = {
  message: string
  content: {
    importadas: number
    errores: Array<{ linea: number; codigo: string; error: string }>
  }
}

export const importarReferencias = async (referencias: TReferenciaImportar[]): AxiosPromise<TImportarReferenciasResponse> => {
  return axiosInstance.post("/referencias/importar", { referencias })
}
