import axiosInstance from "@/libs/axios"
import { AxiosPromise } from "axios"

type TBuscarPorDocumentoRequest = {
	documento_tipo: "dni" | "ruc"
	documento_numero: string
}

type TBuscarPorDocumentoResponse = {
	content: {
		nombres?: string
		apellidoPaterno?: string
		apellidoMaterno?: string
		error?: string
	}
}

export async function buscarPorDocumento({
	documento_tipo,
	documento_numero,
}: TBuscarPorDocumentoRequest): AxiosPromise<TBuscarPorDocumentoResponse> {
	return axiosInstance.get("/dniruc", {
		params: {
			documento_tipo,
			documento_numero,
		},
	})
}

export const cambiarSucursal = async (data: object): AxiosPromise => {
	return axiosInstance.put("autenticacion/usuario/sucursal", data)
}
