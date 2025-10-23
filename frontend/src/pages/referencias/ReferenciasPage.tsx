import { useState, useEffect } from "react"
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Tag,
    Popconfirm,
    Modal,
    Form,
    Switch,
    Tooltip,
    Upload,
} from "antd"
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UploadOutlined,
    DownloadOutlined,
} from "@ant-design/icons"
import type { TableColumnsType, UploadProps } from "antd"
import { TReferencia } from "@/types/referencia"
import * as referenciaService from "./referencias.service"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"

const { Search } = Input

const ReferenciasPage = () => {
    const [referencias, setReferencias] = useState<TReferencia[]>([])
    const [cargando, setCargando] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editando, setEditando] = useState<TReferencia | null>(null)
    const [buscar, setBuscar] = useState("")
    const [filtroActivo, setFiltroActivo] = useState<boolean | undefined>(undefined)
    const [form] = Form.useForm()

    useEffect(() => {
        cargarReferencias()
    }, [filtroActivo])

    const cargarReferencias = async () => {
        setCargando(true)
        try {
            const response = await referenciaService.getReferencias({
                activo: filtroActivo,
                buscar: buscar || undefined,
            })
            setReferencias(response.data.content)
        } catch (error) {
            console.error("Error cargando referencias:", error)
            toast.error("Error al cargar las referencias")
        } finally {
            setCargando(false)
        }
    }

    const handleBuscar = (valor: string) => {
        setBuscar(valor)
        if (valor.trim() === "") {
            cargarReferencias()
        }
    }

    const handleAbrirModal = (referencia?: TReferencia) => {
        if (referencia) {
            setEditando(referencia)
            form.setFieldsValue(referencia)
        } else {
            setEditando(null)
            form.resetFields()
            form.setFieldValue("activo", true)
        }
        setModalVisible(true)
    }

    const handleCerrarModal = () => {
        setModalVisible(false)
        setEditando(null)
        form.resetFields()
    }

    const handleGuardar = async (values: Omit<TReferencia, "id">) => {
        try {
            if (editando) {
                await referenciaService.updateReferencia(editando.id!, values)
                toast.success("Referencia actualizada exitosamente")
            } else {
                await referenciaService.storeReferencia(values)
                toast.success("Referencia creada exitosamente")
            }
            handleCerrarModal()
            cargarReferencias()
        } catch (error: any) {
            console.error("Error guardando referencia:", error)
            if (error.response?.data?.errors) {
                const errores = Object.values(error.response.data.errors).flat()
                toast.error(errores[0] as string)
            } else {
                toast.error("Error al guardar la referencia")
            }
        }
    }

    const handleEliminar = async (id: number) => {
        try {
            await referenciaService.deleteReferencia(id)
            toast.success("Referencia eliminada exitosamente")
            cargarReferencias()
        } catch (error) {
            console.error("Error eliminando referencia:", error)
            toast.error("Error al eliminar la referencia")
        }
    }

    const handleExportarExcel = () => {
        const datosExportar = referencias.map((ref) => ({
            "Código Compra": ref.codigo_compra,
            Descripción: ref.descripcion,
            "Nº Kardex": ref.num_kardex,
            Estado: ref.activo ? "Activo" : "Inactivo",
            "Fecha Creación": ref.created_at
                ? new Date(ref.created_at).toLocaleDateString("es-PE")
                : "",
        }))

        const ws = XLSX.utils.json_to_sheet(datosExportar)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Referencias")
        XLSX.writeFile(wb, `referencias_${new Date().toISOString().split("T")[0]}.xlsx`)
        toast.success("Archivo exportado exitosamente")
    }

    const handleImportarExcel: UploadProps["beforeUpload"] = async (file) => {
        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const worksheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                const referencias = jsonData.map((row: any) => ({
                    codigo_compra: String(row["Código Compra"] || row["codigo_compra"] || ""),
                    descripcion: String(row["Descripción"] || row["descripcion"] || ""),
                    num_kardex: String(row["Nº Kardex"] || row["num_kardex"] || ""),
                    activo: row["Estado"] === "Activo" || row["activo"] === true || true,
                }))

                const response = await referenciaService.importarReferencias(referencias)
                const resultado = response.data.content

                if (resultado.errores.length > 0) {
                    toast.error(
                        `Importación completada con ${resultado.errores.length} errores. Revisa la consola para más detalles.`
                    )
                    console.error("Errores de importación:", resultado.errores)
                } else {
                    toast.success(`${resultado.importadas} referencias importadas exitosamente`)
                }

                cargarReferencias()
            }
            reader.readAsArrayBuffer(file)
        } catch (error) {
            console.error("Error importando archivo:", error)
            toast.error("Error al importar el archivo")
        }
        return false
    }

    const columnas: TableColumnsType<TReferencia> = [
        {
            title: "Código Compra",
            dataIndex: "codigo_compra",
            key: "codigo_compra",
            width: 150,
            render: (text) => <strong className="text-blue-600">{text}</strong>,
        },
        {
            title: "Descripción",
            dataIndex: "descripcion",
            key: "descripcion",
            ellipsis: true,
        },
        {
            title: "Nº Kardex",
            dataIndex: "num_kardex",
            key: "num_kardex",
            width: 120,
            align: "center",
            render: (text) => <Tag color="green">{text}</Tag>,
        },
        {
            title: "Estado",
            dataIndex: "activo",
            key: "activo",
            width: 100,
            align: "center",
            render: (activo: boolean) => (
                <Tag
                    color={activo ? "success" : "default"}
                    icon={activo ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                    {activo ? "Activo" : "Inactivo"}
                </Tag>
            ),
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Editar">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleAbrirModal(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="¿Estás seguro de eliminar esta referencia?"
                        onConfirm={() => handleEliminar(record.id!)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Tooltip title="Eliminar">
                            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Referencias</h1>
                <p className="text-gray-600">
                    Gestión de códigos de compra asociados a números de kardex
                </p>
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <Space>
                        <Search
                            placeholder="Buscar por código, descripción o kardex..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={cargarReferencias}
                            onChange={(e) => handleBuscar(e.target.value)}
                            style={{ width: 350 }}
                        />
                        <Button
                            type={filtroActivo === true ? "primary" : "default"}
                            onClick={() => setFiltroActivo(filtroActivo === true ? undefined : true)}
                        >
                            Activos
                        </Button>
                        <Button
                            type={filtroActivo === false ? "primary" : "default"}
                            onClick={() => setFiltroActivo(filtroActivo === false ? undefined : false)}
                        >
                            Inactivos
                        </Button>
                    </Space>
                    <Space>
                        <Upload beforeUpload={handleImportarExcel} showUploadList={false} accept=".xlsx,.xls">
                            <Button icon={<UploadOutlined />}>Importar Excel</Button>
                        </Upload>
                        <Button icon={<DownloadOutlined />} onClick={handleExportarExcel}>
                            Exportar Excel
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAbrirModal()}>
                            Nueva Referencia
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columnas}
                    dataSource={referencias}
                    rowKey="id"
                    loading={cargando}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} referencias`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Modal de Crear/Editar */}
            <Modal
                title={editando ? "Editar Referencia" : "Nueva Referencia"}
                open={modalVisible}
                onCancel={handleCerrarModal}
                footer={null}
                width={700}
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleGuardar}>
                    <Form.Item
                        label="Código de Compra"
                        name="codigo_compra"
                        rules={[{ required: true, message: "El código de compra es obligatorio" }]}
                    >
                        <Input placeholder="Ej: 10152003" />
                    </Form.Item>

                    <Form.Item
                        label="Descripción"
                        name="descripcion"
                        rules={[{ required: true, message: "La descripción es obligatoria" }]}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Ej: SEMILLAS O ESQUEJES DE ARBOLES FRUTALES"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Número de Kardex"
                        name="num_kardex"
                        rules={[{ required: true, message: "El número de kardex es obligatorio" }]}
                    >
                        <Input placeholder="Ej: 1" />
                    </Form.Item>

                    <Form.Item label="Estado" name="activo" valuePropName="checked">
                        <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space className="w-full justify-end">
                            <Button onClick={handleCerrarModal}>Cancelar</Button>
                            <Button type="primary" htmlType="submit">
                                {editando ? "Actualizar" : "Crear"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ReferenciasPage
