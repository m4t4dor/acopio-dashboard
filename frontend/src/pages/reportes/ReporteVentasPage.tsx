import { useState, useEffect } from "react"
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Empty,
  Spin,
} from "antd"
import {
  SearchOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons"
import type { TableColumnsType } from "antd"
import { TReporteVentas, TDetalleVenta } from "@/types/reporte"
import * as reporteService from "./reportes.service"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import * as XLSX from "xlsx"

const { RangePicker } = DatePicker

const ReporteVentasPage = () => {
  const [cargando, setCargando] = useState(false)
  const [reporte, setReporte] = useState<TReporteVentas | null>(null)
  const [empresasMatriz, setEmpresasMatriz] = useState<Array<{ id: number; nombre: string; ruc: string }>>([])
  const [clientes, setClientes] = useState<Array<{ ruc: string; nombre: string }>>([])
  const [form] = Form.useForm()

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  const cargarDatosIniciales = async () => {
    try {
      const [empresasMatrizRes, clientesRes] = await Promise.all([
        reporteService.getEmpresasMatriz(),
        reporteService.getClientes(),
      ])
      setEmpresasMatriz(empresasMatrizRes.data.content)
      setClientes(clientesRes.data.content)
      
      // Establecer la primera empresa matriz por defecto
      if (empresasMatrizRes.data.content.length > 0) {
        form.setFieldValue('empresa_matriz_id', empresasMatrizRes.data.content[0].id)
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error)
      toast.error("Error al cargar los datos iniciales")
    }
  }

  const handleGenerarReporte = async (values: any) => {
    setCargando(true)
    try {
      let filtros: any = {
        empresa_matriz_id: values.empresa_matriz_id,
        empresa_ruc: values.empresa_ruc,
      }

      // Determinar fechas según el tipo de período seleccionado
      if (values.tipo_periodo === 'mes_especifico') {
        const mesSeleccionado = dayjs(values.mes_especifico)
        filtros.fecha_inicio = mesSeleccionado.startOf('month').format("YYYY-MM-DD")
        filtros.fecha_fin = mesSeleccionado.endOf('month').format("YYYY-MM-DD")
      } else if (values.tipo_periodo === 'periodo_completo') {
        // Período completo desde el inicio de los registros hasta hoy
        filtros.fecha_inicio = "2020-01-01" // Fecha muy antigua para incluir todos los registros
        filtros.fecha_fin = dayjs().format("YYYY-MM-DD")
      } else if (values.tipo_periodo === 'rango_personalizado') {
        filtros.fecha_inicio = values.rango_fechas[0].format("YYYY-MM-DD")
        filtros.fecha_fin = values.rango_fechas[1].format("YYYY-MM-DD")
      }

      const response = await reporteService.getReporteVentas(filtros)
      setReporte(response.data.content)
      
      if (response.data.content.items.length === 0) {
        toast.error("No se encontraron registros para los filtros seleccionados")
      } else {
        toast.success("Reporte generado exitosamente")
      }
    } catch (error: any) {
      console.error("Error generando reporte:", error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Error al generar el reporte")
      }
      setReporte(null)
    } finally {
      setCargando(false)
    }
  }

  const handleExportarExcel = () => {
    if (!reporte || reporte.items.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const datosExportar = reporte.items.map((item) => ({
      Fecha: item.fecha,
      Kardex: item.kardex,
      Descripción: item.descripcion,
      Cliente: item.proveedor,
      "RUC/DNI": item.ruc_dni,
      Cantidad: item.cantidad,
      "Precio Unitario": item.precio_unitario,
      Total: item.total,
    }))

    // Agregar fila de totales
    datosExportar.push({
      Fecha: "",
      Kardex: "",
      Descripción: "TOTAL",
      Cliente: "",
      "RUC/DNI": "",
      Cantidad: reporte.cantidad_total,
      "Precio Unitario": "",
      Total: reporte.monto_total,
    } as any)

    const ws = XLSX.utils.json_to_sheet(datosExportar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas")
    
    const nombreArchivo = `reporte_ventas_${reporte.empresa_ruc}_${dayjs().format("YYYY-MM-DD")}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
    toast.success("Reporte exportado exitosamente")
  }

  const columnas: TableColumnsType<TDetalleVenta> = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 120,
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    },
    {
      title: "Kardex",
      dataIndex: "kardex",
      key: "kardex",
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
    },
    {
      title: "Cliente",
      dataIndex: "proveedor",
      key: "proveedor",
      width: 200,
      ellipsis: true,
      render: (text) => (
        <span className="text-sm font-medium text-gray-700" title={text}>
          {text}
        </span>
      ),
    },
    {
      title: "RUC/DNI",
      dataIndex: "ruc_dni",
      key: "ruc_dni",
      width: 120,
      render: (text) => (
        <span className="text-xs font-mono text-gray-600" title={text}>
          {text}
        </span>
      ),
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      align: "right",
      width: 120,
      render: (value) => <strong className="text-green-600">{value}</strong>,
    },
    {
      title: "Precio Unitario",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      align: "right",
      width: 140,
      render: (value) => `S/ ${Number(value).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 140,
      render: (value) => <strong>S/ {Number(value).toFixed(2)}</strong>,
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCartOutlined className="text-green-600" />
          Reporte de Ventas
        </h1>
        <p className="text-gray-600">
          Consulta las ventas (salidas de inventario) a clientes en un periodo específico
        </p>
      </div>

      <Card className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerarReporte}
          initialValues={{
            tipo_periodo: 'mes_especifico',
            mes_especifico: dayjs().startOf('month'),
            rango_fechas: [dayjs().startOf("month"), dayjs()],
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Form.Item
              label="Empresa Matriz"
              name="empresa_matriz_id"
              rules={[{ required: true, message: "Selecciona la empresa" }]}
            >
              <Select
                placeholder="Seleccionar empresa"
                options={empresasMatriz.map((emp) => ({
                  label: emp.nombre,
                  value: emp.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Cliente (RUC/DNI)"
              name="empresa_ruc"
            >
              <Select
                placeholder="Todos los clientes"
                showSearch
                allowClear
                optionFilterProp="children"
                options={clientes.map((emp) => ({
                  label: `${emp.ruc} - ${emp.nombre}`,
                  value: emp.ruc,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Tipo de Período"
              name="tipo_periodo"
              rules={[{ required: true, message: "Selecciona el tipo de período" }]}
            >
              <Select
                options={[
                  { label: 'Mes Específico', value: 'mes_especifico' },
                  { label: 'Período Completo', value: 'periodo_completo' },
                  { label: 'Rango Personalizado', value: 'rango_personalizado' },
                ]}
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.tipo_periodo !== currentValues.tipo_periodo
              }
            >
              {({ getFieldValue }) => {
                const tipoPeriodo = getFieldValue('tipo_periodo')
                
                if (tipoPeriodo === 'mes_especifico') {
                  return (
                    <Form.Item
                      label="Mes"
                      name="mes_especifico"
                      rules={[{ required: true, message: "Selecciona el mes" }]}
                    >
                      <DatePicker
                        picker="month"
                        format="MM/YYYY"
                        className="w-full"
                        placeholder="Seleccionar mes"
                      />
                    </Form.Item>
                  )
                } else if (tipoPeriodo === 'rango_personalizado') {
                  return (
                    <Form.Item
                      label="Período"
                      name="rango_fechas"
                      rules={[{ required: true, message: "Selecciona el período" }]}
                    >
                      <RangePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        placeholder={["Fecha inicio", "Fecha fin"]}
                      />
                    </Form.Item>
                  )
                } else if (tipoPeriodo === 'periodo_completo') {
                  return (
                    <Form.Item label="Período">
                      <div className="text-center py-2 px-3 bg-green-50 border border-green-200 rounded">
                        <span className="text-green-700 font-medium">
                          Desde el inicio hasta hoy
                        </span>
                      </div>
                    </Form.Item>
                  )
                }
                return null
              }}
            </Form.Item>

            <Form.Item label=" " className="mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={cargando}
                >
                  Generar Reporte
                </Button>
                {reporte && reporte.items.length > 0 && (
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportarExcel}
                  >
                    Exportar
                  </Button>
                )}
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      {cargando && (
        <Card>
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Generando reporte...</p>
          </div>
        </Card>
      )}

      {!cargando && reporte && (
        <>
          {/* Resumen */}
          <Card className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600 text-sm">Cliente:</span>
                <p className="font-bold text-lg">
                  {reporte.empresa_nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {reporte.empresa_ruc !== 'Todos' ? `RUC/DNI: ${reporte.empresa_ruc}` : 'Todos los clientes'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Cantidad Total:</span>
                <p className="font-bold text-2xl text-green-600">
                  {reporte.cantidad_total}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Monto Total:</span>
                <p className="font-bold text-2xl text-blue-600">
                  S/ {Number(reporte.monto_total).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 text-sm">Periodo:</span>
              <p className="font-semibold">
                Del {dayjs(reporte.periodo_inicio).format("DD/MM/YYYY")} al{" "}
                {dayjs(reporte.periodo_fin).format("DD/MM/YYYY")}
              </p>
            </div>
          </Card>

          {/* Tabla de detalles */}
          <Card title={`Detalle de Ventas (${reporte.items.length} registros)`}>
            {reporte.items.length > 0 ? (
                <Table
                columns={columnas}
                dataSource={reporte.items}
                rowKey={(record, index) => `${record.kardex}-${index}`}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} registros`,
                }}
                scroll={{ x: 1200 }}
                summary={(pageData) => {
                  const totalCantidad = pageData.reduce(
                    (sum, item) => sum + Number(item.cantidad || 0),
                    0
                  )
                  const totalMonto = pageData.reduce(
                    (sum, item) => sum + Number(item.total || 0),
                    0
                  )

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="bg-gray-50">
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          <strong>Subtotal (página):</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong className="text-green-600">{totalCantidad}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <strong>S/ {Number(totalMonto).toFixed(2)}</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )
                }}
              />
            ) : (
              <Empty description="No se encontraron registros para este reporte" />
            )}
          </Card>
        </>
      )}

      {!cargando && !reporte && (
        <Card>
          <Empty
            description="Selecciona los filtros y genera un reporte"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  )
}

export default ReporteVentasPage
