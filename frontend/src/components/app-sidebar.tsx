import {
	BankOutlined,
	CloseOutlined,
	HomeOutlined,
	UsergroupAddOutlined,
	UserOutlined,
	FileTextOutlined,
	TagsOutlined,
	BarChartOutlined,
	ShoppingCartOutlined,
	ShoppingOutlined,
	LineChartOutlined,
} from "@ant-design/icons"
import type { MenuProps } from "antd"
import { Button, Menu } from "antd"
import { Link, useLocation } from "react-router-dom"

import { asset } from "@/helpers"
import { cn } from "@/lib/utils"
import { useMenuStore } from "@/stores/menuStore"
import useAuthStore from "../stores/authStore"

type MenuItem = Required<MenuProps>["items"][number]

export function AppSidebar() {
	const usuario = useAuthStore((state) => state.usuario)
	const isMobileMenuOpen = useMenuStore((state) => state.isMobileMenuOpen)
	const toggleMobileMenu = useMenuStore((state) => state.toggleMobileMenu)
	const location = useLocation()

	const items: MenuItem[] = [
		{
			key: "/",
			label: <Link to="/">Inicio</Link>,
			icon: <HomeOutlined />,
		},
	   ...(usuario?.es_rol_super_administrador
		   ? [
				   {
					   key: "/usuarios",
					   label: <Link to="/usuarios">Usuarios</Link>,
					   icon: <UserOutlined />,
				   },
				   /* {
					   key: "/sucursales",
					   label: <Link to="/sucursales">Sucursales</Link>,
					   icon: <BankOutlined />,
				   }, */
				   {
					   key: "/empresas",
					   label: <Link to="/empresas">Empresas</Link>,
					   icon: <BankOutlined />,
				   },
				   {
					   key: "/referencias",
					   label: <Link to="/referencias">Referencias</Link>,
					   icon: <TagsOutlined />,
				   },
			 ]
		   : []),
		{
			key: "/clientes",
			label: <Link to="/clientes">Clientes</Link>,
			icon: <UsergroupAddOutlined />,
		},
		{
			key: "/liquidaciones",
			label: <Link to="/liquidaciones">Liquidaciones</Link>,
			icon: <FileTextOutlined />,
		},
		{
			key: "reportes",
			label: "Reportes",
			icon: <BarChartOutlined />,
			children: [
				{
					key: "/reportes/ventas",
					label: <Link to="/reportes/ventas">Ventas</Link>,
					icon: <ShoppingCartOutlined />,
				},
				{
					key: "/reportes/compras",
					label: <Link to="/reportes/compras">Compras</Link>,
					icon: <ShoppingOutlined />,
				},
				{
					key: "/reportes/comportamiento-precios",
					label: <Link to="/reportes/comportamiento-precios">Comportamiento de Precios</Link>,
					icon: <LineChartOutlined />,
				},
			],
		},
	]

	return (
		<>
			{/* Overlay para móviles */}
			{isMobileMenuOpen && (
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
					onClick={toggleMobileMenu}
				/>
			)}
			
			{/* Sidebar */}
			<div
				className={cn(
					"w-[256px] bg-[#001529] fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out",
					{
						"translate-x-0": isMobileMenuOpen,
						"-translate-x-full md:translate-x-0": !isMobileMenuOpen,
					}
				)}
			>
				{/* Header */}
				<div className="flex justify-between items-center gap-4 p-4 border-b border-gray-600">
					{/* Logo */}
					<img 
						src={asset("assets/logo-blanco.png")} 
						alt="Logo" 
						className="w-full h-8 object-contain object-left" 
					/>
					{/* Botón cerrar móvil */}
					<Button 
						size="small" 
						ghost 
						icon={<CloseOutlined />} 
						className="md:hidden flex-shrink-0" 
						onClick={toggleMobileMenu} 
					/>
				</div>
				
				{/* Menu */}
				<div className="flex-1 overflow-y-auto">
					<Menu 
						theme="dark" 
						selectedKeys={[location.pathname]} 
						mode="inline" 
						items={items}
						className="border-none"
					/>
				</div>
			</div>
		</>
	)
}
