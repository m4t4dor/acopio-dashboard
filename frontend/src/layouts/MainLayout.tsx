import axiosInstance from "@/libs/axios"
import React, { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { asset } from "@/helpers"
import useAuthStore from "@/stores/authStore"
import { TUsuario } from "@/types"

import AppNavbar from "@/components/app-navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { useMenuStore } from "@/stores/menuStore"

const MainLayout: React.FC = () => {
	const closeMobileMenu = useMenuStore((state) => state.closeMobileMenu)
	const location = useLocation()

	useEffect(() => {
		closeMobileMenu()
	}, [location.pathname])
	return (
		<main className="min-h-screen bg-gray-50">
			<AppSidebar />
			<div className="relative md:pl-[calc(256px)] min-h-screen">
				<AppNavbar />
				<div className="p-2 sm:p-4 md:p-6">
					<Outlet />
				</div>
			</div>
		</main>
	)
}

const SplashScreen: React.FC = () => {
	const { cargarUsuario, estaAutenticado, logout } = useAuthStore()
	const navigate = useNavigate()
	const [loading, setLoading] = useState({
		vista: true,
	})

	useEffect(() => {
		if (!estaAutenticado) {
			navigate("/autenticacion/iniciar-sesion")
			return
		}

		// Verificar que el token está en localStorage antes de hacer la petición
		const token = localStorage.getItem("token")
		if (!token) {
		// ...
			navigate("/autenticacion/iniciar-sesion")
			return
		}

		// ...

		axiosInstance
			.get("/autenticacion/usuario")
			.then((response) => {
				// ...
				const usuario = response.data.content.usuario as TUsuario
				cargarUsuario(usuario)
				setLoading({ vista: false })
			})
			.catch((error) => {
				// ...
				// Si es un error 401, usar el método logout del store
				if (error.response?.status === 401) {
					// ...
					logout()
				}
				navigate("/autenticacion/iniciar-sesion")
			})
	}, [])

	if (loading.vista)
		return (
			<div className="flex items-center justify-center min-h-screen bg-primary">
				<div className="text-center text-white">
					<img src={asset("assets/logo-blanco.png")} alt="Logo" className="h-24 mb-4" />
					<p>Cargando...</p>
				</div>
			</div>
		)

	return <MainLayout />
}

export default SplashScreen
