import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TLiquidacion } from "@/types/liquidacion"

type TGetLiquidacionesResponse = {
  content: TLiquidacion[]
}

export const getLiquidaciones = async (): AxiosPromise<TGetLiquidacionesResponse> => {
  return axiosInstance.get("/liquidaciones")
}

type TGetLiquidacionResponse = {
  content: TLiquidacion
}

export const getLiquidacion = async (id: number): AxiosPromise<TGetLiquidacionResponse> => {
  return axiosInstance.get(`/liquidaciones/${id}`)
}

type TStoreLiquidacionResponse = {
  message: string
  content: TLiquidacion
}

export const storeLiquidacion = async (liquidacion: TLiquidacion): AxiosPromise<TStoreLiquidacionResponse> => {
  return axiosInstance.post("/liquidaciones", liquidacion)
}

type TUpdateLiquidacionResponse = {
  message: string
  content: TLiquidacion
}

export const updateLiquidacion = async (id: number, liquidacion: TLiquidacion): AxiosPromise<TUpdateLiquidacionResponse> => {
  return axiosInstance.put(`/liquidaciones/${id}`, liquidacion)
}

type TDeleteLiquidacionResponse = {
  message: string
}

export const deleteLiquidacion = async (id: number): AxiosPromise<TDeleteLiquidacionResponse> => {
  return axiosInstance.delete(`/liquidaciones/${id}`)
}
