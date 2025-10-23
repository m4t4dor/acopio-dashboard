import InputFieldForm from "@/components/antdesign/form/InputFieldForm"
import { renderizarErroresDeValidacion } from "@/helpers"
import { TEmpresa } from "@/types"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button, Col, Row, message } from "antd"
import { isAxiosError } from "axios"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { createEmpresa, updateEmpresa } from "./empresas.service"
import { SearchOutlined } from "@ant-design/icons"
import { buscarPorDocumento } from "@/services/index.service"

const schema = yup.object().shape({
	ruc: yup.string().required("Ingrese el RUC").matches(/^[0-9]{11}$/, "El RUC debe tener 11 dígitos"),
	nombre: yup.string().required("Ingrese el nombre de la empresa"),
	direccion: yup.string().nullable(),
	telefono_principal: yup.string().nullable().test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
		if (!value) return true
		return /^9\d{8}$/.test(value)
	}),
	telefono_alternativo_1: yup.string().nullable().test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
		if (!value) return true
		return /^9\d{8}$/.test(value)
	}),
	telefono_alternativo_2: yup.string().nullable().test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
		if (!value) return true
		return /^9\d{8}$/.test(value)
	}),
})

type FormValues = yup.InferType<typeof schema>

type Props = {
	recordId?: number
	onSaved?: (empresa: TEmpresa) => void
}

const EmpresaForm = ({ recordId, onSaved }: Props) => {
	const isEdit = useMemo(() => !!recordId, [recordId])
	const { handleSubmit, control, setValue, setError, getValues, trigger } = useForm<FormValues>({
		defaultValues: {
			ruc: "",
			nombre: "",
			direccion: "",
			telefono_principal: "",
			telefono_alternativo_1: "",
			telefono_alternativo_2: "",
		},
		resolver: yupResolver(schema),
	})

	const [loading, setLoading] = useState({
		submit: false,
		searchDocument: false,
	})

	const onSubmit = async (data: FormValues) => {
		try {
			setLoading((prev) => ({ ...prev, submit: true }))
			const telefonos = [data.telefono_principal, data.telefono_alternativo_1, data.telefono_alternativo_2]
				.filter((t): t is string => !!t && t.trim() !== "")
			const { telefono_principal, telefono_alternativo_1, telefono_alternativo_2, ...restData } = data
			const submitData = { ...restData, telefono: telefonos.length > 0 ? telefonos : null }
			if (isEdit) {
				const response = await updateEmpresa(recordId!, submitData)
				message.success(response.data.message)
				onSaved?.(response.data.content.empresa)
			} else {
				const response = await createEmpresa(submitData)
				message.success(response.data.message)
				onSaved?.(response.data.content.empresa)
			}
		} catch (error) {
			console.error("Error saving empresa:", error)
			if (isAxiosError(error) && error.response) {
				renderizarErroresDeValidacion(error.response.data.errors, setError)
				message.error(error.response.data.message || "Ocurrió un error al guardar la empresa.")
			} else {
				message.error("Ocurrió un error al guardar la empresa.")
			}
		} finally {
			setLoading((prev) => ({ ...prev, submit: false }))
		}
	}

	const onInvalidForm = () => {
		message.warning("Por favor, revise los campos marcados en rojo.")
	}

	const handleSearchRuc = async () => {
		const isValidRuc = await trigger("ruc")
		if (!isValidRuc) {
			message.warning("Por favor, ingrese un RUC válido de 11 dígitos")
			return
		}
		const currentRuc = getValues("ruc")
		setValue("nombre", "")
		setValue("direccion", "")
		try {
			setLoading((prev) => ({ ...prev, searchDocument: true }))
			const response = await buscarPorDocumento({ documento_tipo: "ruc", documento_numero: currentRuc })
			if (response.data.content.error) {
				message.error(response.data.content.error)
				return
			}
			const data = response.data.content as any
			const { razon_social, direccion } = data
			if (razon_social) {
				setValue("nombre", razon_social)
				setValue("direccion", direccion || "")
			} else {
				message.warning("No se encontró información para el RUC ingresado")
			}
		} catch (error) {
			console.error("Error searching RUC:", error)
			message.error("Error al buscar la información del RUC")
		} finally {
			setLoading((prev) => ({ ...prev, searchDocument: false }))
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit, onInvalidForm)}>
			<Row gutter={16}>
				<Col xs={24} sm={12}>
					<div className="mb-2">
						<label className="form-label">RUC</label>
						<InputFieldForm
							name="ruc"
							control={control}
							inputProps={{
								placeholder: "Ingrese el RUC de 11 dígitos",
								maxLength: 11,
								disabled: isEdit
							}}
							addonAfterSlot={
								<Button
									type="primary"
									ghost
									icon={<SearchOutlined />}
									onClick={handleSearchRuc}
									loading={loading.searchDocument}
									disabled={isEdit}
								/>
							}
						/>
					</div>
				</Col>
				<Col xs={24} sm={12}>
					<div className="mb-2">
						<label className="form-label">Nombre de la Empresa</label>
						<InputFieldForm
							name="nombre"
							control={control}
							inputProps={{ placeholder: "Ingrese el nombre" }}
						/>
					</div>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col span={24}>
					<div className="mb-2">
						<label className="form-label">Dirección</label>
						<InputFieldForm
							name="direccion"
							control={control}
							inputProps={{ placeholder: "Ingrese la dirección (opcional)" }}
						/>
					</div>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Principal</label>
						<InputFieldForm
							name="telefono_principal"
							control={control}
							inputProps={{ placeholder: "Teléfono principal (opcional)" }}
						/>
					</div>
				</Col>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Alternativo 1</label>
						<InputFieldForm
							name="telefono_alternativo_1"
							control={control}
							inputProps={{ placeholder: "Teléfono alternativo (opcional)" }}
						/>
					</div>
				</Col>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Alternativo 2</label>
						<InputFieldForm
							name="telefono_alternativo_2"
							control={control}
							inputProps={{ placeholder: "Teléfono alternativo (opcional)" }}
						/>
					</div>
				</Col>
			</Row>
			<div className="flex justify-end space-x-2 mt-4">
				<Button type="primary" htmlType="submit" loading={loading.submit}>
					{isEdit ? "Actualizar" : "Guardar"}
				</Button>
			</div>
		</form>
	)
}

export default EmpresaForm
