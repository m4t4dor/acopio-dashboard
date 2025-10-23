import React, { useEffect } from "react"
import { Navigate } from "react-router-dom"
import useAuthStore from "../stores/authStore"
import { message } from "antd"
import { EUsuarioRolValues } from "@/enums"

interface ProtectedRouteProps {
	children: React.ReactNode
	roles?: EUsuarioRolValues[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles = [] }) => {
	const estaAutenticado = useAuthStore((state) => state.estaAutenticado)
	const tieneRolPermiso = useAuthStore((state) => state.tieneRolPermiso)
	const tienPermiso = roles.length > 0 ? tieneRolPermiso(roles) : true

	useEffect(() => {
		if (!tienPermiso) {
			message.warning("No tienes permiso para acceder a esta página / recurso o realizar esta acción.")
		}
	}, [tienPermiso])

	if (!estaAutenticado) {
		return <Navigate to="/autenticacion/iniciar-sesion" replace />
	}

	if (!tienPermiso) {
		return <Navigate to="/" replace />
	}

	return children
}

export default ProtectedRoute
