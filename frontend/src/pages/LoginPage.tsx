import InputFieldForm from "@/components/antdesign/form/InputFieldForm"
import InputPasswordFieldForm from "@/components/antdesign/form/InputPasswordFieldForm"
import { asset, renderizarErroresDeValidacion } from "@/helpers"
import axiosInstance from "@/libs/axios"
import useAuthStore from "@/stores/authStore"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button, Card } from "antd"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import * as yup from "yup"

const schema = yup
	.object({
		username: yup.string().required("El nombre de usuario es requerido"),
		password: yup.string().min(6, "La contraseña debe tener al menos 6 caracteres").required("La contraseña es requerida"),
	})
	.required()

type LoginFormData = yup.InferType<typeof schema>

const LoginPage: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const login = useAuthStore((state) => state.login)
	const navigate = useNavigate()
	const { control, handleSubmit, setError } = useForm<LoginFormData>({
		resolver: yupResolver(schema),
	})

	const onSubmit = async (data: LoginFormData) => {
		setLoading(true)
		try {
			const response = await axiosInstance.post("/autenticacion/iniciar-sesion", data)

			const { token, usuario } = response.data.content

			await login(usuario, token)

			navigate("/")
		} catch (error) {
			console.error("Error al iniciar sesión:", error)
			renderizarErroresDeValidacion(error, setError)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center relative overflow-hidden">
			{/* Imagen de fondo responsiva */}
			<div 
				className="absolute inset-0 z-0"
				style={{
					backgroundImage: `url(${asset("assets/login-bg.jpg")})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>
			
			{/* Overlay oscuro para mejorar la legibilidad */}
			<div className="absolute inset-0 z-10 bg-black/40"></div>
			
			{/* Contenedor principal */}
			<div className="relative z-20 w-full max-w-md mx-auto p-4 sm:p-6 md:p-8">
				{/* Card con glassmorphism effect */}
				<Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 rounded-2xl">
					<div className="p-6 sm:p-8">
						<div className="text-center mb-8">
							<img 
								src={asset("assets/logo.png")} 
								className="h-16 sm:h-20 md:h-24 mx-auto mb-6" 
								alt="Logo sistema" 
							/>
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
								Hola, bienvenido
							</h1>
							<p className="text-sm sm:text-base text-gray-600">
								Inicia sesión para continuar
							</p>
						</div>
						
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div>
								<label className="form-label text-sm font-medium text-gray-700 mb-2 block">
									Usuario
								</label>
								<InputFieldForm name="username" control={control} />
							</div>
							<div>
								<label className="form-label text-sm font-medium text-gray-700 mb-2 block">
									Contraseña
								</label>
								<InputPasswordFieldForm name="password" control={control} />
							</div>
							<div className="pt-4">
								<Button 
									htmlType="submit" 
									type="primary" 
									loading={loading} 
									block
									size="large"
									className="h-12 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
								>
									{loading ? "Iniciando sesión..." : "Iniciar sesión"}
								</Button>
							</div>
						</form>
					</div>
				</Card>
			</div>
		</div>
	)
}

export default LoginPage
