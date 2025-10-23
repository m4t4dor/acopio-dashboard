import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TSucursal, TSucursalesConPaginacion } from "@/types"

type TGetSucursalesParams = {
	page?: number
	per_page?: number
}

type TGetSucursalesResponse = {
	content: {
		sucursales: TSucursalesConPaginacion
	}
}

export const getSucursales = async (params?: TGetSucursalesParams): AxiosPromise<TGetSucursalesResponse> => {
	return axiosInstance.get("/sucursales", { params })
}

type TStoreSucursalResponse = {
	message: string
	content: {
		sucursal: TSucursal
	}
}

export const storeSucursal = async (data: object): AxiosPromise<TStoreSucursalResponse> => {
	return axiosInstance.post("/sucursales", data)
}

type TEditSucursalResponse = {
	content: {
		sucursal: TSucursal
	}
}

export const editSucursal = async (id: number): AxiosPromise<TEditSucursalResponse> => {
	return axiosInstance.get(`/sucursales/${id}/edit`)
}

type TUpdateSucursalResponse = {
	message: string
	content: {
		sucursal: TSucursal
	}
}

export const updateSucursal = async (id: number, data: object): AxiosPromise<TUpdateSucursalResponse> => {
	return axiosInstance.put(`/sucursales/${id}`, data)
}

type TDeleteSucursalResponse = {
	message: string
}

export const deleteSucursal = async (id: number): AxiosPromise<TDeleteSucursalResponse> => {
	return axiosInstance.delete(`/sucursales/${id}`)
}
