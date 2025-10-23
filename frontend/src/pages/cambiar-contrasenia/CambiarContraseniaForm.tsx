import InputPasswordFieldForm from "@/components/antdesign/form/InputPasswordFieldForm"
import { renderizarErroresDeValidacion } from "@/helpers"
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { isAxiosError } from "axios"
import { Button, message } from "antd"
import axiosInstance from "@/libs/axios"
import { useState } from "react"

const schema = yup.object().shape({
	password: yup.string().required("Ingrese una nueva contraseña"),
	password_confirmation: yup
		.string()
		.oneOf([yup.ref("password")], "Las contraseñas no coinciden")
		.required("Confirme su nueva contraseña"),
})

type FormValues = yup.InferType<typeof schema>

const CambiarContraseniaForm = () => {
	const {
		handleSubmit,
		control,
		setError,
		reset,
	} = useForm<FormValues>({
		defaultValues: {
			password: "",
			password_confirmation: "",
		},
		resolver: yupResolver(schema),
	})

	const [isLoading, setIsLoading] = useState(false)

	const onSubmit = async (data: FormValues) => {
		setIsLoading(true)
		try {
			const response = await axiosInstance.put("/autenticacion/cambiar-password", data)
			message.success(response.data.message)
			reset()
		} catch (error) {
			console.error("Error al cambiar la contraseña:", error)
			if (isAxiosError(error) && error.response) {
				renderizarErroresDeValidacion(error.response.data.errors, setError)
				message.error(error.response.data.message || "Ocurrió un error al cambiar la contraseña.")
			} else {
				message.error("Ocurrió un error al cambiar la contraseña.")
			}
		} finally {
			setIsLoading(false)
		}
	}

	const onInvalidForm = () => {
		message.warning("Por favor, revise los campos marcados en rojo.")
	}

	return (
		<form onSubmit={handleSubmit(onSubmit, onInvalidForm)}>
			<div className="mb-2">
				<label className="form-label">Nueva Contraseña</label>
				<InputPasswordFieldForm
					name="password"
					control={control}
					inputProps={{ autoComplete: "new-password" }}
				/>
			</div>
			<div className="mb-2">
				<label className="form-label">Confirmar Contraseña</label>
				<InputPasswordFieldForm
					name="password_confirmation"
					control={control}
					inputProps={{ autoComplete: "new-password" }}
				/>
			</div>
			<div className="text-end">
				<Button htmlType="submit" loading={isLoading} type="primary">
					Cambiar Contraseña
				</Button>
			</div>
		</form>
	)
}

export default CambiarContraseniaForm
