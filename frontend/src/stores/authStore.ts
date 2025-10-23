import { EUsuarioRolValues } from "@/enums"
import axiosInstance from "@/libs/axios"
import { TUsuario } from "@/types"
import { create } from "zustand"

interface AuthState {
	estaAutenticado: boolean
	usuario: TUsuario | null
	token: string | null
	login: (usuario: TUsuario, token: string) => void
	logout: () => void
	cargarUsuario: (usuario: TUsuario | null) => void
	tieneRolPermiso: (roles?: EUsuarioRolValues[]) => boolean
}

const getStoredAuth = (): { estaAutenticado: boolean; usuario: TUsuario | null; token: string | null } => {
	const storedToken = localStorage.getItem("token")
	if (storedToken) {
		axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
		return { estaAutenticado: true, usuario: null, token: storedToken }
	}
	return { estaAutenticado: false, usuario: null, token: null }
}

const useAuthStore = create<AuthState>((set, get) => ({
	...getStoredAuth(),
	login: (usuario, token) => {
		localStorage.setItem("usuario", JSON.stringify(usuario))
		localStorage.setItem("token", token)
		axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`
		set({ estaAutenticado: true, usuario: usuario, token })
	},
	logout: () => {
		localStorage.removeItem("usuario")
		localStorage.removeItem("token")
		delete axiosInstance.defaults.headers.common["Authorization"]
		set({ estaAutenticado: false, usuario: null, token: null })
	},
	cargarUsuario: (usuario) => {
		localStorage.setItem("usuario", JSON.stringify(usuario))
		set({ estaAutenticado: !!usuario, usuario })
	},
	tieneRolPermiso: (roles = []) => {
		const usuario = get().usuario
		if (!usuario) return false
		if (usuario.es_rol_super_administrador) return true // Solo gerencia tiene acceso a todo
		return roles.includes(usuario.rol)
	},
}))

export default useAuthStore
