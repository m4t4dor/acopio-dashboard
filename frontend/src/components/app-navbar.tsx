import axiosInstance from "@/libs/axios"
import { getSucursales } from "@/pages/sucursales/sucursales.service"
import { cambiarSucursal } from "@/services/index.service"
import useAuthStore from "@/stores/authStore"
import { useMenuStore } from "@/stores/menuStore"
import { TSucursal } from "@/types"
import { DownOutlined, LockOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons"
import type { MenuProps } from "antd"
import { Avatar, Button, Dropdown, Typography, Spin } from "antd"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const AppNavbar = () => {
	const [loading, setLoading] = useState(false)
	const [loadingSucursal, setLoadingSucursal] = useState(false)
	const [sucursales, setSucursales] = useState<TSucursal[]>([])
	const usuario = useAuthStore((state) => state.usuario)
	const logout = useAuthStore((state) => state.logout)
	const toggleMobileMenu = useMenuStore((state) => state.toggleMobileMenu)

	const handleLogout = async () => {
		try {
			await axiosInstance.post("/autenticacion/cerrar-sesion")
		} catch (error) {
			console.error("Error al cerrar sesión:", error)
		} finally {
			logout()
			window.location.href = "/autenticacion/iniciar-sesion"
		}
	}

	const items: MenuProps["items"] = [
		{
			label: (
				<Link to="/cambiar-contrasena" className="flex items-center gap-2">
					<LockOutlined />
					Cambiar Contraseña
				</Link>
			),
			key: "cambiar-contrasena",
		},
		{
			type: "divider",
		},
		{
			label: (
				<span className="flex items-center gap-2" onClick={handleLogout}>
					<LogoutOutlined />
					Cerrar Sesión
				</span>
			),
			key: "cerrar-sesion",
		},
	]

	const sucursalItems: MenuProps["items"] = sucursales.map((sucursal) => ({
		label: sucursal.nombre,
		key: sucursal.id,
		onClick: () => {
			handleChangeSucursal(sucursal.id)
		},
	}))

	const handleChangeSucursal = async (sucursalId: number) => {
        setLoadingSucursal(true)
		try {
			await cambiarSucursal({ sucursal_id: sucursalId })
			window.location.reload() // Recargar la página para aplicar el cambio de sucursal
		} catch (error) {
			console.error("Error al cambiar de sucursal:", error)
		} finally {
            setLoadingSucursal(false)
        }
	}

	const getViewData = async () => {
		setLoading(true)
		try {
			const response = await getSucursales()
			setSucursales(response.data.content.sucursales.data)
		} catch (error) {
			console.error("Error al obtener las sucursales:", error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		getViewData()
	}, [])

	return (
		<nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
			<div className="flex justify-between items-center h-14 px-4">
				{/* Botón de menú móvil */}
				<div className="md:hidden">
					<Button type="text" onClick={toggleMobileMenu} icon={<MenuOutlined />} size="large" />
				</div>

				{/* Contenedor de opciones del usuario */}
				<div className="flex items-center ml-auto space-x-2">
					{/* Selector de sucursal - oculto en móviles pequeños */}
					{(usuario?.es_rol_super_administrador || usuario?.es_rol_supervisor) && loading == false && (
						<div className="hidden sm:block">
							<Dropdown menu={{ items: sucursalItems }} trigger={["click"]} placement="bottomRight">
								<div className="flex gap-2 px-3 py-2 items-center cursor-pointer hover:bg-gray-100 transition-colors rounded-md">
									<div className="flex flex-col gap-0.5">
										<Typography.Text type="secondary" className="text-xs leading-none">
											Sucursal:
										</Typography.Text>
										<Typography.Text className="leading-none text-sm">
											{usuario?.sucursal?.nombre || "Sin sucursal"}
										</Typography.Text>
									</div>
									{loadingSucursal ? <Spin size="small" /> : <DownOutlined className="text-sm" />}
								</div>
							</Dropdown>
						</div>
					)}

					{/* Menú de usuario */}
					<Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
						<div className="flex gap-2 px-3 py-2 items-center cursor-pointer hover:bg-gray-100 transition-colors rounded-md">
							<Avatar size="small">{(usuario?.nombre_completo || "U")[0].toUpperCase()}</Avatar>
							<div className="hidden sm:flex flex-col">
								<Typography.Text strong className="text-sm leading-tight">
									{usuario?.nombre_completo || "Sin nombre"}
								</Typography.Text>
								<Typography.Text type="secondary" className="text-xs">
									{usuario?.rol || ""}
								</Typography.Text>
							</div>
							<DownOutlined className="text-sm" />
						</div>
					</Dropdown>
				</div>
			</div>
		</nav>
	)
}

export default AppNavbar
