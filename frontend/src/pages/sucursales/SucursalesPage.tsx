import CustomBreadcrumb from "@/components/antdesign/CustomBreadcrumb"
import { TSucursal, TSucursalesConPaginacion } from "@/types"
import { Alert, Button, Card, Popconfirm, Skeleton, Table, TableProps, Tag, Tooltip, message } from "antd"
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useEffect, useMemo, useState } from "react"
import SucursalGuardarModal from "./SucursalGuardarModal"
import { deleteSucursal, getSucursales } from "./sucursales.service"
import { isAxiosError } from "axios"

const SucursalesPage = () => {
	const [loading, setLoading] = useState(true)

	const [paginacion, setPaginacion] = useState({
		pageIndex: 1,
		pageSize: 15,
	})

	const [sucursalesConPaginacion, setSucursalesConPaginacion] = useState<TSucursalesConPaginacion>()

	const [modals, setModals] = useState<{
		showSucursalGuardarModal: boolean
		sucursalEditarId?: number
	}>({
		showSucursalGuardarModal: false,
		sucursalEditarId: undefined,
	})

	const columns: TableProps<TSucursal>["columns"] = useMemo(
		() => [
			{
				title: "Sucursal",
				dataIndex: "nombre",
				render: (text: string, record: TSucursal) => (
					<div className="space-y-1">
						<div className="font-medium text-sm">{text}</div>
						<div className="text-xs text-gray-500 sm:hidden">
							{record.direccion}
						</div>
						{record.telefono && (
							<div className="text-xs text-gray-500 sm:hidden">
								Tel: {record.telefono}
							</div>
						)}
						{record.email && (
							<div className="text-xs text-gray-500 sm:hidden">
								{record.email}
							</div>
						)}
					</div>
				),
			},
			{
				title: "Dirección",
				dataIndex: "direccion",
				responsive: ['md'],
			},
			{
				title: "Teléfono",
				dataIndex: "telefono",
				responsive: ['lg'],
			},
			{
				title: "Email",
				dataIndex: "email",
				responsive: ['lg'],
			},
			{
				title: "Estado",
				width: 80,
				render: (_, record) => {
					const activo = record.activo
					return <Tag color={activo ? "success" : "error"} className="text-xs">
						{activo ? "ACTIVO" : "INACTIVO"}
					</Tag>
				},
			},
			{
				title: "Acciones",
				width: 80,
				render: (_, record) => {
					return (
						<div className="flex justify-center">
							<Tooltip title="Editar" placement="bottom">
								<Button onClick={() => onEditarSucursal(record)} icon={<EditOutlined />} type="primary" size="small" />
							</Tooltip>
							<Popconfirm
								title="Confirmar eliminación"
								description="¿Estás seguro de eliminar esta sucursal?"
								onConfirm={() => handleDelete(record.id)}
								okText="Eliminar"
								okButtonProps={{ danger: true }}
								cancelText="Cancelar"
							>
								<Tooltip title="Eliminar" placement="bottom">
									<Button icon={<DeleteOutlined />} size="small" danger className="ml-1" />
								</Tooltip>
							</Popconfirm>
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
			const response = await getSucursales({
				page: paginacion.pageIndex,
				per_page: paginacion.pageSize,
			})
			setSucursalesConPaginacion(response.data.content.sucursales)
			setLoading(false)
		} catch (error) {
			console.error("Error fetching sucursales:", error)
			setLoading(false)
		}
	}

	const handleDelete = async (id: number) => {
		try {
			const response = await deleteSucursal(id)
			message.success(response.data.message)
			getViewData()
		} catch (error) {
			console.error("Error deleting sucursal:", error)
			message.error(isAxiosError(error) ? error.response?.data.message : "Ocurrió un error al eliminar la sucursal.")
		}
	}

	const onNuevaSucursal = () => {
		setModals((prevModals) => ({
			...prevModals,
			showSucursalGuardarModal: true,
			sucursalEditarId: undefined,
		}))
	}

	const onEditarSucursal = (sucursal: TSucursal) => {
		setModals((prevModals) => ({
			...prevModals,
			showSucursalGuardarModal: true,
			sucursalEditarId: sucursal.id,
		}))
	}

	useEffect(() => {
		getViewData()
	}, [paginacion])

	return (
		<>
			<CustomBreadcrumb
				links={[
					{
						label: "Sucursales",
					},
				]}
			/>
			<Card
				className="mt-4"
				title="Sucursales"
				extra={
					<Button onClick={onNuevaSucursal} type="primary" icon={<PlusOutlined />}>
						Nueva Sucursal
					</Button>
				}
			>
				{loading ? (
					<Skeleton active />
				) : (sucursalesConPaginacion?.total || 0) > 0 ? (
					<div>
						<Table
							rowKey="id"
							size="small"
							columns={columns}
							dataSource={sucursalesConPaginacion?.data || []}
							pagination={{
								showTotal: (total) => `${total} resultados`,
								total: sucursalesConPaginacion?.total,
								pageSize: paginacion.pageSize,
								current: paginacion.pageIndex,
								showSizeChanger: true,
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
					<Alert type="info" message="No hay sucursales disponibles." showIcon />
				)}
			</Card>

			{modals.showSucursalGuardarModal && (
				<SucursalGuardarModal
					recordId={modals.sucursalEditarId}
					onClose={() => {
						setModals((prevModals) => ({
							...prevModals,
							showSucursalGuardarModal: false,
						}))
					}}
					onSaved={() => {
						setModals((prevModals) => ({
							...prevModals,
							showSucursalGuardarModal: false,
						}))
						getViewData()
					}}
				/>
			)}
		</>
	)
}

export default SucursalesPage
