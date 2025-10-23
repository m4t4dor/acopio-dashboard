import { AxiosPromise } from "axios"
import axiosInstance from "@/libs/axios"
import { TUsuario, TUsuariosConPaginacion, TSucursal } from "@/types"

type TGetUsuariosParams = {
	page?: number
	per_page?: number
}

type TGetUsuariosResponse = {
	content: {
		usuarios: TUsuariosConPaginacion
	}
}

export const getUsuarios = async (params?: TGetUsuariosParams): AxiosPromise<TGetUsuariosResponse> => {
	return axiosInstance.get("/usuarios", { params })
}

type TCreateUsuarioResponse = {
	content: {
		sucursales: TSucursal[]
	}
}

export const createUsuario = async (): AxiosPromise<TCreateUsuarioResponse> => {
	return axiosInstance.get("/usuarios/create")
}

type TStoreUsuarioResponse = {
	message: string
	content: {
		usuario: TUsuario
	}
}

export const storeUsuario = async (data: object): AxiosPromise<TStoreUsuarioResponse> => {
	return axiosInstance.post("/usuarios", data)
}

type TEditUsuarioResponse = {
	content: {
		usuario: TUsuario
		sucursales: TSucursal[]
	}
}

export const editUsuario = async (id: number): AxiosPromise<TEditUsuarioResponse> => {
	return axiosInstance.get(`/usuarios/${id}/edit`)
}

type TUpdateUsuarioResponse = {
	message: string
	content: {
		usuario: TUsuario
	}
}

export const updateUsuario = async (id: number, data: object): AxiosPromise<TUpdateUsuarioResponse> => {
	return axiosInstance.put(`/usuarios/${id}`, data)
}

type TDeleteUsuarioResponse = {
	message: string
}

export const deleteUsuario = async (id: number): AxiosPromise<TDeleteUsuarioResponse> => {
	return axiosInstance.delete(`/usuarios/${id}`)
}
