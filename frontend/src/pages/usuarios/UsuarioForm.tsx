import InputFieldForm from "@/components/antdesign/form/InputFieldForm"
import InputPasswordFieldForm from "@/components/antdesign/form/InputPasswordFieldForm"
import SelectFieldForm from "@/components/antdesign/form/SelectFieldForm"
import { EUsuarioRolValues } from "@/enums"
import { renderizarErroresDeValidacion } from "@/helpers"
import { TSucursal } from "@/types"
import { yupResolver } from "@hookform/resolvers/yup"
import { Alert, Button, message, Skeleton, Switch } from "antd"
import { isAxiosError } from "axios"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import * as yup from "yup"
import { createUsuario, editUsuario, storeUsuario, updateUsuario } from "./usuarios.service"

const schema = yup.object().shape({
	nombre_completo: yup.string().required("Ingrese el nombre completo"),
	direccion: yup.string().required("Ingrese la dirección"),
	telefono: yup
		.string()
		.required("Ingrese el teléfono")
		.matches(/^9\d{8}$/, "El teléfono debe ser un número de 9 dígitos que comience con 9"),
	email: yup.string().email("Ingrese un email válido").required("Ingrese el email"),
	username: yup.string().required("Ingrese un nombre de usuario"),
	password: yup
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres")
		.when("$isEdit", {
			is: false,
			then: () => yup.string().required("Ingrese una contraseña"),
			otherwise: () => yup.string(),
		}),
	password_confirmation: yup.string().when("password", {
		is: (password: string) => password && password.length > 0,
		then: () =>
			yup
				.string()
				.required("Confirme la contraseña")
				.oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
		otherwise: () => yup.string(),
	}),
	rol: yup.string().required("Seleccione un rol"),
	activo: yup.boolean(),
	sucursal_id: yup.string().nullable(),
})

type FormValues = yup.InferType<typeof schema>

type Props = {
	recordId?: number
	onSaved?: () => void
}

const UsuarioForm = ({ recordId, onSaved }: Props) => {
	const isEdit = useMemo(() => !!recordId, [recordId])
	const { handleSubmit, control, setValue, setError } = useForm<FormValues>({
		defaultValues: {
			nombre_completo: "",
			direccion: "",
			telefono: "",
			email: "",
			username: "",
			password: "",
			password_confirmation: "",
			rol: EUsuarioRolValues.ADMINISTRADOR,
			activo: true,
			sucursal_id: null,
		},
		resolver: yupResolver(schema),
		context: { isEdit },
	})

	const [loading, setLoading] = useState({
		view: true,
		submit: false,
	})

	const [sucursales, setSucursales] = useState<TSucursal[]>([])

	const onSubmit = async (data: FormValues) => {
		try {
			setLoading((prev) => ({ ...prev, submit: true }))

			const submitData = {
				...data,
				sucursal_id: data.sucursal_id ? Number(data.sucursal_id) : null,
			}

			if (isEdit) {
				const response = await updateUsuario(recordId!, submitData)
				message.success(response.data.message)

				setValue("password", "")
				setValue("password_confirmation", "")
			} else {
				const response = await storeUsuario(submitData)
				message.success(response.data.message)

				setValue("nombre_completo", "")
				setValue("direccion", "")
				setValue("telefono", "")
				setValue("email", "")
				setValue("username", "")
				setValue("password", "")
				setValue("password_confirmation", "")
				setValue("rol", EUsuarioRolValues.ADMINISTRADOR)
				setValue("activo", true)
				setValue("sucursal_id", null)
			}

			if (onSaved) {
				onSaved()
			}
		} catch (error) {
			console.error("Error al procesar la solicitud:", error)
			if (isAxiosError(error) && error.response) {
				renderizarErroresDeValidacion(error.response.data.errors, setError)
				message.error(error.response.data.message || "Ocurrió un error al procesar la solicitud.")
			} else {
				message.error("Ocurrió un error al procesar la solicitud.")
			}
		} finally {
			setLoading((prev) => ({ ...prev, submit: false }))
		}
	}

	const onInvalidForm = () => {
		message.warning("Por favor, revise los campos marcados en rojo.")
	}
	const getViewData = async () => {
		try {
			setLoading((prev) => ({ ...prev, view: true }))

			if (isEdit) {
				const response = await editUsuario(recordId!)
				const { usuario, sucursales } = response.data.content

				setValue("nombre_completo", usuario.nombre_completo || "")
				setValue("direccion", usuario.direccion || "")
				setValue("telefono", usuario.telefono || "")
				setValue("email", usuario.email || "")
				setValue("username", usuario.username)
				setValue("rol", usuario.rol)
				setValue("activo", usuario.activo)
				setValue("sucursal_id", usuario.sucursal_id ? String(usuario.sucursal_id) : null)

				setSucursales(sucursales || [])
			} else {
				const response = await createUsuario()
				setSucursales(response.data.content.sucursales || [])
			}
		} catch (error) {
			console.error("Error fetching usuario:", error)
			message.error("Ocurrió un error al obtener el usuario.")
		} finally {
			setLoading((prev) => ({ ...prev, view: false }))
		}
	}

	useEffect(() => {
		getViewData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (loading.view) {
		return <Skeleton active />
	}
	return (
		<>
			<form onSubmit={handleSubmit(onSubmit, onInvalidForm)} className="space-y-4">
				{/* Información Personal */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="form-label">Nombre completo</label>
						<InputFieldForm name="nombre_completo" control={control} inputProps={{ autoComplete: "off" }} />
					</div>
					<div>
						<label className="form-label">Dirección</label>
						<InputFieldForm name="direccion" control={control} inputProps={{ autoComplete: "off" }} />
					</div>
				</div>
				
				{/* Contacto */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="form-label">Teléfono</label>
						<InputFieldForm name="telefono" control={control} inputProps={{ autoComplete: "off" }} />
					</div>
					<div>
						<label className="form-label">Email</label>
						<InputFieldForm name="email" control={control} inputProps={{ autoComplete: "off", type: "email" }} />
					</div>
				</div>
				
				{/* Cuenta y Acceso */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="form-label">Usuario</label>
						<InputFieldForm name="username" control={control} inputProps={{ autoComplete: "off" }} />
					</div>
					<div>
						<label className="form-label">Rol</label>
						<SelectFieldForm
							name="rol"
							control={control}
							options={[
								{ label: "Gerencia", value: EUsuarioRolValues.GERENCIA },
								{ label: "Administrador", value: EUsuarioRolValues.ADMINISTRADOR },
								{ label: "Supervisor", value: EUsuarioRolValues.SUPERVISOR },
								{ label: "Asistente", value: EUsuarioRolValues.ASISTENTE },
							]}
						/>
					</div>
				</div>
				
				{/* Contraseñas */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="form-label">Contraseña</label>
						<InputPasswordFieldForm
							name="password"
							control={control}
							inputProps={{ autoComplete: "new-password" }}
						/>
						{isEdit && (
							<Alert className="mt-2" type="info" showIcon message="Llene este campo solo si desea cambiar la contraseña." />
						)}
					</div>
					<div>
						<label className="form-label">Confirmar contraseña</label>
						<InputPasswordFieldForm
							name="password_confirmation"
							control={control}
							inputProps={{ autoComplete: "new-password" }}
						/>
					</div>
				</div>
				
				{/* Sucursal y Estado */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="form-label">Sucursal</label>
						<SelectFieldForm
							name="sucursal_id"
							control={control}
							options={sucursales.map((sucursal) => ({
								value: String(sucursal.id),
								label: sucursal.nombre,
							}))}
							selectProps={{
								placeholder: "Seleccione una sucursal",
								allowClear: true,
							}}
						/>
					</div>
					<div>
						<label className="form-label">Estado</label>
						<Controller
							name="activo"
							control={control}
							render={({ field }) => (
								<div className="mt-2">
									<Switch
										checkedChildren="Activo"
										unCheckedChildren="Inactivo"
										checked={field.value}
										onChange={field.onChange}
									/>
								</div>
							)}
						/>
					</div>
				</div>
				
				<div className="flex flex-col sm:flex-row gap-2 pt-4">
					<Button 
						htmlType="submit" 
						loading={loading.submit} 
						type="primary"
						className="w-full sm:w-auto sm:ml-auto"
						size="large"
					>
						{isEdit ? "Actualizar" : "Guardar"}
					</Button>
				</div>
			</form>
		</>
	)
}

export default UsuarioForm
