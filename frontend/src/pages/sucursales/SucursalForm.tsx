import InputFieldForm from "@/components/antdesign/form/InputFieldForm"
import { renderizarErroresDeValidacion } from "@/helpers"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button, message, Skeleton, Switch } from "antd"
import { isAxiosError } from "axios"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import * as yup from "yup"
import { editSucursal, storeSucursal, updateSucursal } from "./sucursales.service"

const schema = yup.object().shape({
	nombre: yup.string().required("Ingrese el nombre"),
	direccion: yup.string().required("Ingrese la dirección"),
	telefono: yup
		.string()
		.required("Ingrese el teléfono")
		.matches(/^9\d{8}$/, "El teléfono debe ser un número de 9 dígitos que comience con 9"),
	email: yup.string().email("Ingrese un email válido").required("Ingrese el email"),
	activo: yup.boolean(),
})

type FormValues = yup.InferType<typeof schema>

type Props = {
	recordId?: number
	onSaved?: () => void
}

const SucursalForm = ({ recordId, onSaved }: Props) => {
	const isEdit = useMemo(() => !!recordId, [recordId])
	const { handleSubmit, control, setValue, setError } = useForm<FormValues>({
		defaultValues: {
			nombre: "",
			direccion: "",
			telefono: "",
			email: "",
			activo: true,
		},
		resolver: yupResolver(schema),
	})

	const [loading, setLoading] = useState({
		view: true,
		submit: false,
	})

	const onSubmit = async (data: FormValues) => {
		try {
			setLoading((prev) => ({ ...prev, submit: true }))
			if (isEdit) {
				const response = await updateSucursal(recordId!, data)
				message.success(response.data.message)
			} else {
				const response = await storeSucursal(data)
				message.success(response.data.message)

				setValue("nombre", "")
				setValue("direccion", "")
				setValue("telefono", "")
				setValue("email", "")
				setValue("activo", true)
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
		if (isEdit) {
			try {
				const response = await editSucursal(recordId!)
				const { sucursal } = response.data.content

				setValue("nombre", sucursal.nombre || "")
				setValue("direccion", sucursal.direccion || "")
				setValue("telefono", sucursal.telefono || "")
				setValue("email", sucursal.email || "")
				setValue("activo", sucursal.activo)
				setLoading((prev) => ({ ...prev, view: false }))
			} catch (error) {
				console.error("Error fetching sucursal:", error)
				message.error("Ocurrió un error al obtener la sucursal.")
			}
		} else {
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
			<form onSubmit={handleSubmit(onSubmit, onInvalidForm)}>
				<div className="mb-2">
					<label className="form-label">Nombre</label>
					<InputFieldForm name="nombre" control={control} inputProps={{ autoComplete: "off" }} />
				</div>
				<div className="mb-2">
					<label className="form-label">Dirección</label>
					<InputFieldForm name="direccion" control={control} inputProps={{ autoComplete: "off" }} />
				</div>
				<div className="mb-2">
					<label className="form-label">Teléfono</label>
					<InputFieldForm name="telefono" control={control} inputProps={{ autoComplete: "off" }} />
				</div>
				<div className="mb-2">
					<label className="form-label">Email</label>
					<InputFieldForm name="email" control={control} inputProps={{ autoComplete: "off", type: "email" }} />
				</div>
				<div className="mb-2">
					<label className="form-label">Activo</label>
					<Controller
						name="activo"
						control={control}
						render={({ field }) => (
							<div>
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
				<div className="text-end">
					<Button htmlType="submit" loading={loading.submit} type="primary">
						Guardar
					</Button>
				</div>
			</form>
		</>
	)
}

export default SucursalForm
