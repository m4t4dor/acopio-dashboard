import InputFieldForm from "@/components/antdesign/form/InputFieldForm"
import SelectFieldForm from "@/components/antdesign/form/SelectFieldForm"
import { renderizarErroresDeValidacion } from "@/helpers"
import { TCliente, TSucursal } from "@/types"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button, Col, Row, Skeleton, message } from "antd"
import { isAxiosError } from "axios"
import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import * as yup from "yup"
import { createCliente, editCliente, storeCliente, updateCliente } from "./clientes.service"
import { SearchOutlined } from "@ant-design/icons"
import { buscarPorDocumento } from "@/services/index.service"
import useAuthStore from "@/stores/authStore"

const schema = yup.object().shape({
	documento_tipo: yup.string().required("Seleccione el tipo de documento"),
	documento_numero: yup.string().required("Ingrese el número de documento"),
	nombres: yup.string().when('documento_tipo', {
		is: 'dni',
		then: (schema) => schema.required("Los nombres son requeridos para tipo de documento DNI"),
		otherwise: (schema) => schema.nullable(),
	}),
	nombre_comercial: yup.string().when('documento_tipo', {
		is: 'ruc',
		then: (schema) => schema.required("El nombre comercial es requerido para tipo de documento RUC"),
		otherwise: (schema) => schema.nullable(),
	}),
	direccion: yup.string().nullable(),
	telefono_principal: yup
		.string()
		.nullable()
		.test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
			if (!value) return true
			return /^9\d{8}$/.test(value)
		}),
	telefono_alternativo_1: yup
		.string()
		.nullable()
		.test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
			if (!value) return true
			return /^9\d{8}$/.test(value)
		}),
	telefono_alternativo_2: yup
		.string()
		.nullable()
		.test("telefono", "El teléfono debe ser un número de 9 dígitos que comience con 9", function (value) {
			if (!value) return true
			return /^9\d{8}$/.test(value)
		}),
	sucursal_id: yup.string().required("Seleccione una sucursal"),
})

type FormValues = yup.InferType<typeof schema>

type Props = {
	recordId?: number
	onSaved?: (cliente: TCliente) => void
}

const ClienteForm = ({ recordId, onSaved }: Props) => {
	const usuario = useAuthStore((state) => state.usuario)
	const isEdit = useMemo(() => !!recordId, [recordId])
	const { handleSubmit, control, setValue, setError, getValues, trigger } = useForm<FormValues>({
		defaultValues: {
			documento_tipo: "ruc",
			documento_numero: "",
			nombres: "",
			nombre_comercial: "",
			direccion: "",
			telefono_principal: "",
			telefono_alternativo_1: "",
			telefono_alternativo_2: "",
			sucursal_id: "",
		},
		resolver: yupResolver(schema),
	})

	const documentoTipoValue = useWatch({
		name: "documento_tipo",
		control,
	})

	const [loading, setLoading] = useState({
		view: true,
		submit: false,
		searchDocument: false,
	})

	const [sucursales, setSucursales] = useState<TSucursal[]>([])

	const onSubmit = async (data: FormValues) => {
		try {
			setLoading((prev) => ({ ...prev, submit: true }))
			const telefonos = [data.telefono_principal, data.telefono_alternativo_1, data.telefono_alternativo_2].filter(t => t && t.trim() !== "")
			const { telefono_principal, telefono_alternativo_1, telefono_alternativo_2, ...restData } = data
			const submitData = { ...restData, sucursal_id: Number(data.sucursal_id), telefono: telefonos.length > 0 ? telefonos : null }
			if (isEdit) {
				const response = await updateCliente(recordId!, submitData)
				message.success(response.data.message)
				onSaved?.(response.data.content.cliente)
			} else {
				const response = await storeCliente(submitData)
				message.success(response.data.message)
				onSaved?.(response.data.content.cliente)
			}
		} catch (error) {
			console.error("Error saving cliente:", error)
			if (isAxiosError(error) && error.response) {
				renderizarErroresDeValidacion(error.response.data.errors, setError)
				message.error(error.response.data.message || "Ocurrió un error al guardar el cliente.")
			} else {
				message.error("Ocurrió un error al guardar el cliente.")
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
				const response = await editCliente(recordId!)
				const cliente = response.data.content.cliente
				const sucursales = response.data.content.sucursales
				setValue("documento_tipo", cliente.documento_tipo)
				setValue("documento_numero", cliente.documento_numero)
				setValue("nombres", cliente.nombres || "")
				setValue("nombre_comercial", cliente.nombre_comercial || "")
				setValue("direccion", cliente.direccion || "")
				if (cliente.telefono && Array.isArray(cliente.telefono)) {
					setValue("telefono_principal", cliente.telefono[0] || "")
					setValue("telefono_alternativo_1", cliente.telefono[1] || "")
					setValue("telefono_alternativo_2", cliente.telefono[2] || "")
				} else {
					setValue("telefono_principal", cliente.telefono_principal || "")
					setValue("telefono_alternativo_1", "")
					setValue("telefono_alternativo_2", "")
				}
				setValue("sucursal_id", String(cliente.sucursal_id))
				setSucursales(sucursales || [])
			} else {
				const response = await createCliente()
				setSucursales(response.data.content.sucursales || [])
				setValue("sucursal_id", String(usuario!.sucursal_id || ""))
			}
		} catch (error) {
			console.error("Error fetching data:", error)
			message.error("Ocurrió un error al obtener los datos.")
		} finally {
			setLoading((prev) => ({ ...prev, view: false }))
		}
	}

	const handleSearchDocument = async () => {
		const isValidDocumentoNumero = await trigger("documento_numero")
		if (!isValidDocumentoNumero) {
			message.warning("Por favor, ingrese un número de documento válido")
			return
		}
		const currentDocumentoTipo = getValues("documento_tipo")
		const currentDocumentoNumero = getValues("documento_numero")
		if (currentDocumentoTipo === "dni") { setValue("nombres", "") }
		else if (currentDocumentoTipo === "ruc") { setValue("nombre_comercial", ""); setValue("direccion", "") }
		try {
			setLoading((prev) => ({ ...prev, searchDocument: true }))
			const response = await buscarPorDocumento({ documento_tipo: currentDocumentoTipo as "dni" | "ruc", documento_numero: currentDocumentoNumero })
			if (response.data.content.error) {
				message.error(response.data.content.error)
				return
			}
			if (currentDocumentoTipo === "dni") {
				const { nombres, apellidoPaterno, apellidoMaterno } = response.data.content
				if (nombres && apellidoPaterno && apellidoMaterno) {
					setValue("nombres", nombres + " " + apellidoPaterno + " " + apellidoMaterno)
				} else { message.warning("No se encontró información para el DNI ingresado") }
			} else if (currentDocumentoTipo === "ruc") {
				const data = response.data.content as any
				const { razon_social, direccion } = data
				if (razon_social) {
					setValue("nombre_comercial", razon_social)
					setValue("direccion", direccion || "")
				} else { message.warning("No se encontró información para el RUC ingresado") }
			}
		} catch (error) {
			console.error("Error searching document:", error)
			message.error("Error al buscar la información del documento")
		} finally {
			setLoading((prev) => ({ ...prev, searchDocument: false }))
		}
	}

	useEffect(() => { getViewData() }, [])

	if (loading.view) { return <Skeleton active /> }

	return (
		<form onSubmit={handleSubmit(onSubmit, onInvalidForm)}>
			<Row gutter={16}>
				<Col xs={24} sm={12} md={8}>
					<div className="mb-2">
						<label className="form-label">Tipo de Documento</label>
						<SelectFieldForm name="documento_tipo" control={control} options={[{ value: "dni", label: "DNI" }, { value: "ruc", label: "RUC" }, { value: "carnet_extranjeria", label: "Carnet de Extranjería" }, { value: "pasaporte", label: "Pasaporte" }]} selectProps={{ placeholder: "Seleccione el tipo", disabled: isEdit && usuario?.es_rol_asistente }} />
					</div>
				</Col>
				<Col xs={24} sm={12} md={8}>
					<div className="mb-2">
						<label className="form-label">Número de Documento</label>
						<InputFieldForm name="documento_numero" control={control} inputProps={{ placeholder: "Ingrese el número", disabled: isEdit && usuario?.es_rol_asistente }} addonAfterSlot={<Button type="primary" ghost icon={<SearchOutlined />} onClick={handleSearchDocument} loading={loading.searchDocument} disabled={(!["dni", "ruc"].includes(documentoTipoValue)) || (isEdit && usuario?.es_rol_asistente)} />} />
					</div>
				</Col>
				<Col xs={24} sm={24} md={8}>
					<div className="mb-2">
						<label className="form-label">Sucursal</label>
						<SelectFieldForm name="sucursal_id" control={control} options={sucursales.map((sucursal) => ({ value: String(sucursal.id), label: sucursal.nombre }))} selectProps={{ placeholder: "Seleccione una sucursal", disabled: isEdit && usuario?.es_rol_asistente }} />
					</div>
				</Col>
			</Row>
			{documentoTipoValue === "dni" && (
				<Row gutter={16}>
					<Col span={24}>
						<div className="mb-2">
							<label className="form-label">Nombres Completos</label>
							<InputFieldForm name="nombres" control={control} inputProps={{ placeholder: "Ingrese los nombres completos", disabled: isEdit && usuario?.es_rol_asistente }} />
						</div>
					</Col>
				</Row>
			)}
			{documentoTipoValue === "ruc" && (
				<Row gutter={16}>
					<Col span={24}>
						<div className="mb-2">
							<label className="form-label">Nombre Comercial / Razón Social</label>
							<InputFieldForm name="nombre_comercial" control={control} inputProps={{ placeholder: "Ingrese el nombre comercial" }} />
						</div>
					</Col>
				</Row>
			)}
			<Row gutter={16}>
				<Col span={24}>
					<div className="mb-2">
						<label className="form-label">Dirección</label>
						<InputFieldForm name="direccion" control={control} inputProps={{ placeholder: "Ingrese la dirección (opcional)" }} />
					</div>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Principal</label>
						<InputFieldForm name="telefono_principal" control={control} inputProps={{ placeholder: "Teléfono principal (opcional)" }} />
					</div>
				</Col>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Alternativo 1</label>
						<InputFieldForm name="telefono_alternativo_1" control={control} inputProps={{ placeholder: "Teléfono alternativo (opcional)" }} />
					</div>
				</Col>
				<Col xs={24} sm={8}>
					<div className="mb-2">
						<label className="form-label">Teléfono Alternativo 2</label>
						<InputFieldForm name="telefono_alternativo_2" control={control} inputProps={{ placeholder: "Teléfono alternativo (opcional)" }} />
					</div>
				</Col>
			</Row>
			<div className="flex justify-end space-x-2 mt-4">
				<Button type="primary" htmlType="submit" loading={loading.submit}>{isEdit ? "Actualizar" : "Guardar"}</Button>
			</div>
		</form>
	)
}

export default ClienteForm
