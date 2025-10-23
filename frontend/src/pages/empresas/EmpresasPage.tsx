import CustomBreadcrumb from "@/components/antdesign/CustomBreadcrumb"
import { TEmpresa, TEmpresasConPaginacion } from "@/types"
import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import type { TableProps } from "antd"
import { Button, Card, Col, Input, Row, Skeleton, Table, Tooltip } from "antd"
import { useEffect, useMemo, useState } from "react"
import EmpresaGuardarModal from "./EmpresaGuardarModal"
import { getEmpresas } from "./empresas.service"

type TFiltros = {
	buscar: string
}

const EmpresasPage = () => {
	const [loading, setLoading] = useState(true)

	const [paginacion, setPaginacion] = useState({
		pageIndex: 1,
		pageSize: 15,
	})

	const [empresasConPaginacion, setEmpresasConPaginacion] = useState<TEmpresasConPaginacion>()

	const [modals, setModals] = useState<{
		showEmpresaGuardarModal: boolean
		empresaEditarId?: number
	}>({
		showEmpresaGuardarModal: false,
		empresaEditarId: undefined,
	})

	const [filtros, setFiltros] = useState<TFiltros>({ buscar: "" })

	const columns: TableProps<TEmpresa>["columns"] = useMemo(
		() => [
			{
				title: "RUC",
				dataIndex: "ruc",
				width: 130,
				responsive: ['sm'],
			},
			{
				title: "Empresa",
				dataIndex: "nombre",
				render: (_: string, record: TEmpresa) => {
					const telefonos = Array.isArray(record.telefono) ? record.telefono : []
					const telefonoPrincipal = telefonos[0]
					const telefonosAlternativos = telefonos.slice(1)
					
					return (
						<div className="space-y-1">
							<div className="font-medium text-sm">{record.nombre}</div>
							<div className="text-xs text-gray-500 sm:hidden">
								RUC: {record.ruc}
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
				width: 150,
				responsive: ['sm'],
				render: (telefono: string[]) => {
					if (!telefono || telefono.length === 0) return "-"
					const telefonoPrincipal = telefono[0]
					const telefonosAlternativos = telefono.slice(1)
					
					return (
						<div className="space-y-1">
							<div className="text-xs">{telefonoPrincipal}</div>
							{telefonosAlternativos.length > 0 && (
								<Tooltip title={telefonosAlternativos.join(", ")}>
									<div className="text-xs text-gray-500 cursor-help">
										+{telefonosAlternativos.length} más
									</div>
								</Tooltip>
							)}
						</div>
					)
				}
			},
			{
				title: "Acciones",
				key: "acciones",
				width: 100,
				render: (_: unknown, record: TEmpresa) => (
					<div className="flex gap-2">
						<Tooltip title="Editar">
							<Button
								type="primary"
								ghost
								icon={<EditOutlined />}
								onClick={() => handleOpenEditarModal(record)}
								size="small"
							/>
						</Tooltip>
					</div>
				),
			},
		],
		[]
	)

	const fetchData = async () => {
		try {
			setLoading(true)
			const params = {
				page: paginacion.pageIndex,
				per_page: paginacion.pageSize,
				filtros: {
					buscar: filtros.buscar || undefined,
				},
			}

			const response = await getEmpresas(params)
			setEmpresasConPaginacion(response.data.content.empresas)
		} catch (error) {
			console.error("Error al obtener empresas:", error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [paginacion, filtros])

	const handleOpenCrearModal = () => {
		setModals({ showEmpresaGuardarModal: true, empresaEditarId: undefined })
	}

	const handleOpenEditarModal = (empresa: TEmpresa) => {
		setModals({ showEmpresaGuardarModal: true, empresaEditarId: empresa.id })
	}

	const handleCloseModal = () => {
		setModals({ showEmpresaGuardarModal: false, empresaEditarId: undefined })
	}

	const handleSaved = () => {
		fetchData()
	}

	if (loading && !empresasConPaginacion) {
		return <Skeleton active />
	}

	return (
		<>
			<CustomBreadcrumb
				links={[
					{ label: "Inicio", to: "/" },
					{ label: "Empresas" },
				]}
			/>

			<Card
				title="Empresas Matriz"
				extra={
					<Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCrearModal}>
						Nueva Empresa
					</Button>
				}
			>
				<Row gutter={[16, 16]} className="mb-4">
					<Col xs={24} sm={12} md={8}>
						<Input.Search
							placeholder="Buscar por RUC o nombre"
							allowClear
							onSearch={(value) => {
								setFiltros({ buscar: value })
								setPaginacion({ ...paginacion, pageIndex: 1 })
							}}
							onChange={(e) => {
								if (e.target.value === "") {
									setFiltros({ buscar: "" })
								}
							}}
						/>
					</Col>
				</Row>

				<Table
					columns={columns}
					dataSource={empresasConPaginacion?.data || []}
					rowKey="id"
					loading={loading}
					pagination={{
						current: empresasConPaginacion?.current_page || 1,
						pageSize: paginacion.pageSize,
						total: empresasConPaginacion?.total || 0,
						showSizeChanger: true,
						pageSizeOptions: ["10", "15", "20", "50"],
						onChange: (page, pageSize) => {
							setPaginacion({ pageIndex: page, pageSize })
						},
					}}
					scroll={{ x: 800 }}
				/>
			</Card>

			{modals.showEmpresaGuardarModal && (
				<EmpresaGuardarModal
					recordId={modals.empresaEditarId}
					onClose={handleCloseModal}
					onSaved={handleSaved}
				/>
			)}
		</>
	)
}

export default EmpresasPage
