import ProtectedRoute from "@/components/ProtectedRoute"
import MainLayout from "@/layouts/MainLayout"
import LoginPage from "@/pages/LoginPage"
import { Routes as BrowserRoutes, Route } from "react-router-dom"

import CambiarContraseniaPage from "@/pages/cambiar-contrasenia/CambiarContraseniaPage"
import UsuariosPage from "@/pages/usuarios/UsuariosPage"
import InicioPage from "./pages/inicio/InicioPage"
import SucursalesPage from "./pages/sucursales/SucursalesPage"
import ClientesPage from "./pages/clientes/ClientesPage"
import EmpresasPage from "./pages/empresas/EmpresasPage"
import LiquidacionesPage from "./pages/liquidaciones/LiquidacionesPage"
import ReferenciasPage from "./pages/referencias/ReferenciasPage"
import ReporteVentasPage from "./pages/reportes/ReporteVentasPage"
import ReporteComprasPage from "./pages/reportes/ReporteComprasPage"
import ComportamientoPreciosPage from "./pages/reportes/ComportamientoPreciosPage"
import { EUsuarioRolValues } from "./enums"

const Routes = () => {
	return (
	   <BrowserRoutes>
		   <Route path="/autenticacion/iniciar-sesion" element={<LoginPage />} />
		   <Route path="/" element={<MainLayout />}>
				<Route
					index
					element={
						<ProtectedRoute>
							<InicioPage />
						</ProtectedRoute>
					}
				/>
				{/* Cambiar contraseña */}
				<Route
					path="cambiar-contrasena"
					element={
						<ProtectedRoute>
							<CambiarContraseniaPage />
						</ProtectedRoute>
					}
				/>
			   {/* Usuarios */}
				<Route
					path="usuarios"
					element={
						<ProtectedRoute roles={[EUsuarioRolValues.ADMINISTRADOR]}>
							<UsuariosPage />
						</ProtectedRoute>
					}
				/>
			   {/* Sucursales */}
				<Route
					path="sucursales"
					element={
						<ProtectedRoute roles={[EUsuarioRolValues.ADMINISTRADOR]}>
							<SucursalesPage />
						</ProtectedRoute>
					}
				/>
			   {/* Clientes */}
				<Route
					path="clientes"
					element={
						<ProtectedRoute>
							<ClientesPage />
						</ProtectedRoute>
					}
				/>
				{/* Empresas */}
				<Route
					path="empresas"
					element={
						<ProtectedRoute roles={[EUsuarioRolValues.ADMINISTRADOR]}>
							<EmpresasPage />
						</ProtectedRoute>
					}
				/>
				{/* Liquidaciones */}
				<Route
					path="liquidaciones"
					element={
						<ProtectedRoute>
							<LiquidacionesPage />
						</ProtectedRoute>
					}
				/>
				{/* Referencias */}
				<Route
					path="referencias"
					element={
						<ProtectedRoute roles={[EUsuarioRolValues.ADMINISTRADOR]}>
							<ReferenciasPage />
						</ProtectedRoute>
					}
				/>
				{/* Reportes */}
				<Route
					path="reportes/ventas"
					element={
						<ProtectedRoute>
							<ReporteVentasPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="reportes/compras"
					element={
						<ProtectedRoute>
							<ReporteComprasPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="reportes/comportamiento-precios"
					element={
						<ProtectedRoute>
							<ComportamientoPreciosPage />
						</ProtectedRoute>
					}
				/>
			</Route>
		</BrowserRoutes>
	)
}

export default Routes
