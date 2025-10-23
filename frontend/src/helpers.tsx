import { isAxiosError } from "axios"
import { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { MESES } from "./constants"

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const asset = (path: string) => {
	return import.meta.env.VITE_APP_BASE_URL + path
}

export const formatoMoneda = (monto: number | string) => {
	return new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "PEN",
	}).format(Number(monto))
}

export const obtenerLaravelValidationErrorsResponse = (errorResponse: unknown) => {
	if (!isAxiosError(errorResponse)) {
		return {}
	}

	const errors = (errorResponse?.response?.data?.errors as Record<string, string[]>) || {}

	return Object.fromEntries(
		Object.entries(errors).map(([key, value]) => {
			return [key, value.join(", ")]
		})
	)
}

export const renderizarErroresDeValidacion = <T extends FieldValues>(errorResponse: unknown, setError: UseFormSetError<T>) => {
	const errors = obtenerLaravelValidationErrorsResponse(errorResponse)
	Object.entries(errors).forEach(([key, value]) => {
		setError(key as Path<T>, { type: "server", message: value })
	})
}

export const getMesPorNumero = (numero: number) => {
	return MESES[numero - 1]
}