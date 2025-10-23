import { message } from "antd"
import axios, { isAxiosError } from "axios"

const axiosInstance = axios.create({
	baseURL: (import.meta.env.VITE_API_URL as string) + "/api/panel-de-administracion",
	headers: {
		"Content-Type": "application/json",
		"Accept": "application/json",
		"X-Requested-With": "XMLHttpRequest",
	},
})

// Agregar interceptor para manejar error 403
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (isAxiosError(error) && error.response) {
			if (error.response.status == 403) {
				console.log("mostrar toast de error 403")
				message.warning("No tienes permiso para acceder a esta página / recurso o realizar esta acción.")
			} else if (error.response.status == 401) {
				console.log("mostrar toast de error 401 (no autorizado)")
				message.warning("Tu sesión ha expirado o no tienes los permisos necesarios.")
			} else if (error.response.status >= 500) {
				console.log("mostrar toast de error 500 (servidor)")
				message.error("Ha ocurrido un error en el servidor. Por favor, inténtalo de nuevo más tarde.")
			}
		}
		return Promise.reject(error)
	}
)

export default axiosInstance
