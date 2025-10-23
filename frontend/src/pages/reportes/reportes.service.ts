import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import {
  TReporteVentas,
  TReporteCompras,
  TComportamientoPrecios,
  TFiltrosReporteVentas,
  TFiltrosReporteCompras,
  TFiltrosComportamientoPrecios,
} from "@/types/reporte"

// Reporte de Ventas
type TGetReporteVentasResponse = {
  content: TReporteVentas
}

export const getReporteVentas = async (
  filtros: TFiltrosReporteVentas
): AxiosPromise<TGetReporteVentasResponse> => {
  return axiosInstance.post("/reportes/ventas", filtros)
}

// Reporte de Compras
type TGetReporteComprasResponse = {
  content: TReporteCompras
}

export const getReporteCompras = async (
  filtros: TFiltrosReporteCompras
): AxiosPromise<TGetReporteComprasResponse> => {
  return axiosInstance.post("/reportes/compras", filtros)
}

// Comportamiento de Precios
type TGetComportamientoPreciosResponse = {
  content: TComportamientoPrecios[]
}

export const getComportamientoPrecios = async (
  filtros: TFiltrosComportamientoPrecios
): AxiosPromise<TGetComportamientoPreciosResponse> => {
  return axiosInstance.post("/reportes/comportamiento-precios", filtros)
}

// Obtener lista de clientes únicos (solo con salidas)
type TGetClientesResponse = {
  content: Array<{ ruc: string; nombre: string }>
}

export const getClientes = async (): AxiosPromise<TGetClientesResponse> => {
  return axiosInstance.get("/reportes/clientes")
}

// Obtener lista de proveedores únicos (solo con ingresos)
type TGetProveedoresResponse = {
  content: Array<{ ruc: string; nombre: string }>
}

export const getProveedores = async (): AxiosPromise<TGetProveedoresResponse> => {
  return axiosInstance.get("/reportes/proveedores")
}

// Obtener lista de kardex únicos
type TGetKardexResponse = {
  content: Array<{ kardex: string; descripcion: string }>
}

export const getKardexList = async (): AxiosPromise<TGetKardexResponse> => {
  return axiosInstance.get("/reportes/kardex")
}

// Obtener lista de empresas matriz
type TGetEmpresasMatrizResponse = {
  content: Array<{ id: number; nombre: string; ruc: string }>
}

export const getEmpresasMatriz = async (): AxiosPromise<TGetEmpresasMatrizResponse> => {
  return axiosInstance.get("/reportes/empresas-matriz")
}
