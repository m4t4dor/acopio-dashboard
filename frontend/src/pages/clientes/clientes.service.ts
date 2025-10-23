import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TCliente, TClientesConPaginacion, TSucursal } from "@/types"

type TGetClientesParams = {
	page?: number
	per_page?: number
	filtros?: {
		buscar?: string
		nivel?: string
	}
}

type TGetClientesResponse = {
	content: {
		clientes: TClientesConPaginacion
	}
}

export const getClientes = async (params?: TGetClientesParams): AxiosPromise<TGetClientesResponse> => {
	return axiosInstance.get("/clientes", { params })
}

type TCreateClienteResponse = {
	content: {
		sucursales: TSucursal[]
	}
}

export const createCliente = async (): AxiosPromise<TCreateClienteResponse> => {
	return axiosInstance.get("/clientes/create")
}

type TStoreClienteResponse = {
	message: string
	content: {
		cliente: TCliente
	}
}

export const storeCliente = async (data: object): AxiosPromise<TStoreClienteResponse> => {
	return axiosInstance.post("/clientes", data)
}

type TEditClienteResponse = {
	content: {
		cliente: TCliente
		sucursales: TSucursal[]
	}
}

export const editCliente = async (id: number): AxiosPromise<TEditClienteResponse> => {
	return axiosInstance.get(`/clientes/${id}/edit`)
}

type TUpdateClienteResponse = {
	message: string
	content: {
		cliente: TCliente
	}
}

export const updateCliente = async (id: number, data: object): AxiosPromise<TUpdateClienteResponse> => {
	return axiosInstance.put(`/clientes/${id}`, data)
}

type TDeleteClienteResponse = {
	message: string
}

export const deleteCliente = async (id: number): AxiosPromise<TDeleteClienteResponse> => {
	return axiosInstance.delete(`/clientes/${id}`)
}
