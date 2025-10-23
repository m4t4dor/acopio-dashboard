import CustomBreadcrumb from "@/components/antdesign/CustomBreadcrumb"
import { TUsuario, TUsuariosConPaginacion } from "@/types"
import { Alert, Button, Card, Popconfirm, Skeleton, Table, TableProps, Tag, Tooltip, message } from "antd"
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"
import { useEffect, useMemo, useState } from "react"
import UsuarioGuardarModal from "./UsuarioGuardarModal"
import { deleteUsuario, getUsuarios } from "./usuarios.service"
import { isAxiosError } from "axios"

const UsuariosPage = () => {
	const [loading, setLoading] = useState(true)

	const [paginacion, setPaginacion] = useState({
		pageIndex: 1,
		pageSize: 15,
	})

	const [usuariosConPaginacion, setUsuariosConPaginacion] = useState<TUsuariosConPaginacion>()

	const [modals, setModals] = useState<{
		showUsuarioGuardarModal: boolean
		usuarioEditarId?: number
	}>({
		showUsuarioGuardarModal: false,
		usuarioEditarId: undefined,
	})
	const columns: TableProps<TUsuario>["columns"] = useMemo(
		() => [
			{
				title: "Usuario",
				dataIndex: "nombre_completo",
				render: (text: string, record: TUsuario) => (
					<div className="space-y-1">
						<div className="font-medium text-sm">{text}</div>
						<div className="text-xs text-gray-500 sm:hidden">
							@{record.username}
						</div>
						<div className="text-xs text-gray-500 sm:hidden">
							{record.email}
						</div>
						{record.telefono && (
							<div className="text-xs text-gray-500 sm:hidden">
								Tel: {record.telefono}
							</div>
						)}
					</div>
				),
			},
			{
				title: "Email",
				dataIndex: "email",
				responsive: ['md'],
			},
			{
				title: "Usuario",
				dataIndex: "username",
				responsive: ['sm'],
			},
			{
				title: "Teléfono",
				dataIndex: "telefono",
				responsive: ['lg'],
			},
			{
				title: "Rol",
				dataIndex: "rol",
				width: 100,
				render: (_, record) => {
					return <Tag className="text-xs">{record.rol}</Tag>
				},
			},
			{
				title: "Sucursal",
				responsive: ['lg'],
				render: (_, record) => {
					return record.sucursal?.nombre || "Sin sucursal"
				},
			},
			{
				title: "Estado",
				width: 80,
				responsive: ['md'],
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
								<Button onClick={() => onEditarUsuario(record)} icon={<EditOutlined />} type="primary" size="small" />
							</Tooltip>
							<Popconfirm
								title="Confirmar eliminación"
								description="¿Estás seguro de eliminar este usuario?"
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
			const response = await getUsuarios({
				page: paginacion.pageIndex,
				per_page: paginacion.pageSize,
			})
			setUsuariosConPaginacion(response.data.content.usuarios)
			setLoading(false)
		} catch (error) {
			console.error("Error fetching usuarios:", error)
			setLoading(false)
		}
	}

	const handleDelete = async (id: number) => {
		try {
			const response = await deleteUsuario(id)
			message.success(response.data.message)
			getViewData()
		} catch (error) {
			console.error("Error deleting usuario:", error)
			// message.error("Ocurrió un error al eliminar el usuario.")
			message.error(isAxiosError(error) ? error.response?.data.message : "Ocurrió un error al eliminar el usuario.")
		}
	}

	const onNuevoUsuario = () => {
		setModals((prevModals) => ({
			...prevModals,
			showUsuarioGuardarModal: true,
			usuarioEditarId: undefined,
		}))
	}

	const onEditarUsuario = (usuario: TUsuario) => {
		setModals((prevModals) => ({
			...prevModals,
			showUsuarioGuardarModal: true,
			usuarioEditarId: usuario.id,
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
						label: "Usuarios",
					},
				]}
			/>
			<Card
				className="mt-4"
				title={
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<span className="text-lg font-semibold">Usuarios</span>
						<Button 
							onClick={onNuevoUsuario} 
							type="primary" 
							icon={<PlusOutlined />}
							className="w-full sm:w-auto"
						>
							<span className="hidden sm:inline">Nuevo Usuario</span>
							<span className="sm:hidden">Nuevo</span>
						</Button>
					</div>
				}
			>
				{loading ? (
					<Skeleton active />
				) : (usuariosConPaginacion?.total || 0) > 0 ? (
					<div className="overflow-x-auto">
						<Table
							rowKey="id"
							size="small"
							columns={columns}
							dataSource={usuariosConPaginacion?.data || []}
							scroll={{ x: 'max-content' }}
							pagination={{
								showTotal: (total, range) => 
									<span className="text-sm">
										{`${range?.[0]}-${range?.[1]} de ${total} resultados`}
									</span>,
								total: usuariosConPaginacion?.total,
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
					<Alert type="info" message="No hay usuarios disponibles." showIcon />
				)}
			</Card>

			{modals.showUsuarioGuardarModal && (
				<UsuarioGuardarModal
					recordId={modals.usuarioEditarId}
					onClose={() => {
						setModals((prevModals) => ({
							...prevModals,
							showUsuarioGuardarModal: false,
						}))
					}}
					onSaved={() => {
						setModals((prevModals) => ({
							...prevModals,
							showUsuarioGuardarModal: false,
						}))
						getViewData()
					}}
				/>
			)}
		</>
	)
}

export default UsuariosPage
