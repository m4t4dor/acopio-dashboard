import CustomBreadcrumb from "@/components/antdesign/CustomBreadcrumb"
import useAuthStore from "@/stores/authStore"
import { EUsuarioRolValues } from "@/enums"
import { TCliente, TClientesConPaginacion } from "@/types"
import { /* DeleteOutlined, */ EditOutlined, PlusOutlined } from "@ant-design/icons"
import type { TableProps } from "antd"
import { Alert, Button, Card, Col, Input, /* Popconfirm, */ Row, Skeleton, Table, Tooltip/* , message */ } from "antd"
/* import { isAxiosError } from "axios" */
import { useEffect, useMemo, useState } from "react"
import ClienteGuardarModal from "./ClienteGuardarModal"
import { /* deleteCliente, */ getClientes } from "./clientes.service"

type TFiltros = {
	buscar: string
}

const ClientesPage = () => {
	const tieneRolPermiso = useAuthStore((state) => state.tieneRolPermiso)
	const [loading, setLoading] = useState(true)

	const [paginacion, setPaginacion] = useState({
		pageIndex: 1,
		pageSize: 15,
	})

	const [clientesConPaginacion, setClientesConPaginacion] = useState<TClientesConPaginacion>()

	const [modals, setModals] = useState<{
		showClienteGuardarModal: boolean
		clienteEditarId?: number
	}>({
		showClienteGuardarModal: false,
		clienteEditarId: undefined,
	})

	const [filtros, setFiltros] = useState<TFiltros>({ buscar: "" })

	const columns: TableProps<TCliente>["columns"] = useMemo(
		() => [
			{
				title: "Tipo Doc.",
				dataIndex: "documento_tipo",
				width: 120,
				responsive: ['md'],
				render: (tipo: string) => {
					const tipoMap = {
						dni: "DNI",
						ruc: "RUC",
						carnet_extranjeria: "C. Extranjería",
						pasaporte: "Pasaporte",
					}
					return tipoMap[tipo as keyof typeof tipoMap] || tipo
				},
			},
			{
				title: "Documento",
				dataIndex: "documento_numero",
				width: 130,
				responsive: ['sm'],
			},
			{
				title: "Cliente",
				dataIndex: "nombre_mostrar",
				render: (_: string, record: TCliente) => {
					const telefonos = Array.isArray(record.telefono) ? record.telefono : [record.telefono].filter(Boolean)
					const telefonoPrincipal = telefonos[0]
					const telefonosAlternativos = telefonos.slice(1)
					
					return (
						<div className="space-y-1">
							<div className="font-medium text-sm">{record.nombre_mostrar}</div>
							<div className="text-xs text-gray-500 sm:hidden">
								{record.documento_tipo.toUpperCase()}: {record.documento_numero}
							</div>
							{record.direccion && (
								<div className="text-xs text-gray-500 lg:hidden">
									{record.direccion}
								</div>
							)}
							{telefonoPrincipal && (
								<div className="text-xs text-gray-500 sm:hidden">
									Tel: {telefonoPrincipal}
								</div>
							)}
							{telefonosAlternativos.length > 0 && (
								<div className="text-xs text-gray-500 sm:hidden">
									Tel Alt: {telefonosAlternativos.join(", ")}
								</div>
							)}
						</div>
					)
				},
			},
			{
				title: "Dirección",
				dataIndex: "direccion",
				responsive: ['lg'],
				render: (direccion: string) => direccion || "-"
			},
			{
				title: "Teléfono",
				dataIndex: "telefono",
				width: 120,
				responsive: ['md'],
				render: (telefono: string | string[]) => {
					if (Array.isArray(telefono) && telefono.length > 0) {
						return telefono[0] || "-"
					}
					return "-"
				},
			},
			{
				title: "Sucursal",
				render: (_, record) => record.sucursal?.nombre || "",
				width: 150,
				responsive: ['lg'],
			},
			{
				title: "Acciones",
				width: 80,
				render: (_, record) => {
					return (
						<div className="flex justify-center">
							{tieneRolPermiso([EUsuarioRolValues.SUPERVISOR, EUsuarioRolValues.ADMINISTRADOR]) && (
								<Tooltip title="Editar" placement="bottom">
									<Button size="small" type="primary" icon={<EditOutlined />} onClick={() => onEditarCliente(record)} />
								</Tooltip>
							)}
							{/* {tieneRolPermiso() && (
								<Popconfirm
									title="Confirmar eliminación"
									description="¿Estás seguro de eliminar este cliente?"
									onConfirm={() => handleDelete(record.id)}
									okText="Eliminar"
									okButtonProps={{ danger: true }}
									cancelText="Cancelar"
								>
									<Tooltip title="Eliminar" placement="bottom">
										<Button size="small" danger icon={<DeleteOutlined />} className="ml-1" />
									</Tooltip>
								</Popconfirm>
							)} */}
						</div>
					)
				},
			},
		],
		[]
	)

	const getViewData = async () => {
		setLoading(true)
		try {
			const response = await getClientes({
				page: paginacion.pageIndex,
				per_page: paginacion.pageSize,
				filtros,
			})
			setClientesConPaginacion(response.data.content.clientes)
			setLoading(false)
		} catch (error) {
			console.error("Error fetching clientes:", error)
			setLoading(false)
		}
	}

	/* const handleDelete = async (id: number) => {
		try {
			const response = await deleteCliente(id)
			message.success(response.data.message)
			getViewData()
		} catch (error) {
			console.error("Error deleting cliente:", error)
			message.error(isAxiosError(error) ? error.response?.data.message : "Ocurrió un error al eliminar el cliente.")
		}
	} */

	const onNuevoCliente = () => {
		setModals((prevModals) => ({
			...prevModals,
			showClienteGuardarModal: true,
			clienteEditarId: undefined,
		}))
	}

	const onEditarCliente = (cliente: TCliente) => {
		setModals((prevModals) => ({
			...prevModals,
			showClienteGuardarModal: true,
			clienteEditarId: cliente.id,
		}))
	}

	useEffect(() => {
		getViewData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paginacion])

	return (
		<>
			<CustomBreadcrumb
				links={[
					{
						label: "Clientes",
					},
				]}
			/>

			<Card
				className="mt-4"
				title={
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<span className="text-lg font-semibold">Clientes</span>
						{tieneRolPermiso([EUsuarioRolValues.SUPERVISOR, EUsuarioRolValues.ADMINISTRADOR]) && (
							<Button 
								onClick={onNuevoCliente} 
								type="primary" 
								icon={<PlusOutlined />}
								className="w-full sm:w-auto"
							>
								<span className="hidden sm:inline">Nuevo Cliente</span>
								<span className="sm:hidden">Nuevo</span>
							</Button>
						)}
					</div>
				}
			>
				<form
					className="mb-4"
					onSubmit={(e) => {
						e.preventDefault()
						setPaginacion((prev) => ({ ...prev, pageIndex: 1 }))
					}}
				>
					<Row gutter={[16, 16]}>
						<Col xs={24} sm={18} md={16} lg={18}>
							<div className="mb-4">
								<label className="form-label text-sm font-medium">Buscar Cliente</label>
								<Input
									value={filtros.buscar}
									onChange={(e) => setFiltros((prev) => ({ ...prev, buscar: e.target.value }))}
									placeholder="Nombres, nombre comercial o documento"
									allowClear
									size="middle"
								/>
							</div>
						</Col>
						<Col xs={24} sm={6} md={8} lg={6}>
							<div className="flex items-end h-full">
								<Button 
									type="primary" 
									htmlType="submit" 
									className="mb-4 w-full md:w-auto"
									size="middle"
								>
									Buscar
								</Button>
							</div>
						</Col>
					</Row>
				</form>

				{loading ? (
					<Skeleton active />
				) : (clientesConPaginacion?.total || 0) > 0 ? (
					<div className="overflow-x-auto">
						<Table
							rowKey="id"
							size="small"
							columns={columns}
							dataSource={clientesConPaginacion?.data || []}
							scroll={{ x: 'max-content' }}
							pagination={{
								showTotal: (total, range) => 
									<span className="text-sm">
										{`${range?.[0]}-${range?.[1]} de ${total} resultados`}
									</span>,
								total: clientesConPaginacion?.total,
								pageSize: paginacion.pageSize,
								current: paginacion.pageIndex,
								showSizeChanger: true,
								showQuickJumper: true,
								pageSizeOptions: ['10', '15', '25', '50'],
								responsive: true,
								onChange: (page, pageSize) => {
									setPaginacion({
										pageIndex: page,
										pageSize: pageSize,
									})
								},
							}}
						/>
					</div>
				) : (
					<Alert type="info" message="No hay clientes disponibles." showIcon />
				)}
			</Card>

			{modals.showClienteGuardarModal && (
				<ClienteGuardarModal
					recordId={modals.clienteEditarId}
					onClose={() => {
						setModals((prevModals) => ({
							...prevModals,
							showClienteGuardarModal: false,
							clienteEditarId: undefined,
						}))
					}}
					onSaved={() => {
						setModals((prevModals) => ({
							...prevModals,
							showClienteGuardarModal: false,
							clienteEditarId: undefined,
						}))
						getViewData()
					}}
				/>
			)}
		</>
	)
}

export default ClientesPage
