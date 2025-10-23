import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TEmpresa, TEmpresasConPaginacion } from "@/types"

type TGetEmpresasParams = {
	page?: number
	per_page?: number
	filtros?: {
		buscar?: string
	}
}

type TGetEmpresasResponse = {
	content: {
		empresas: TEmpresasConPaginacion
	}
}

export const getEmpresas = async (params?: TGetEmpresasParams): AxiosPromise<TGetEmpresasResponse> => {
	return axiosInstance.get("/empresas", { params })
}

type TStoreEmpresaResponse = {
	message: string
	content: {
		empresa: TEmpresa
	}
}

export const createEmpresa = async (data: object): AxiosPromise<TStoreEmpresaResponse> => {
	return axiosInstance.post("/empresas", data)
}

type TUpdateEmpresaResponse = {
	message: string
	content: {
		empresa: TEmpresa
	}
}

export const updateEmpresa = async (id: number, data: object): AxiosPromise<TUpdateEmpresaResponse> => {
	return axiosInstance.put(`/empresas/${id}`, data)
}

type TDeleteEmpresaResponse = {
	message: string
}

export const deleteEmpresa = async (id: number): AxiosPromise<TDeleteEmpresaResponse> => {
	return axiosInstance.delete(`/empresas/${id}`)
}
