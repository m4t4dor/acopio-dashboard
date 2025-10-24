import { useState, useEffect } from "react"
import {
  Card,
  Form,
  Select,
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
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons"
import type { TableColumnsType } from "antd"
import { TComportamientoPrecios } from "@/types/reporte"
import * as reporteService from "./reportes.service"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import * as XLSX from "xlsx"

const mesesDelAnio = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

const ComportamientoPreciosPage = () => {
  const [cargando, setCargando] = useState(false)
  const [datos, setDatos] = useState<TComportamientoPrecios[]>([])
  const [empresasMatriz, setEmpresasMatriz] = useState<Array<{ id: number; nombre: string; ruc: string }>>([])
  const [kardexList, setKardexList] = useState<Array<{ kardex: string; descripcion: string }>>([])
  const [form] = Form.useForm()

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  const cargarDatosIniciales = async () => {
    try {
      const [empresasMatrizRes, kardexRes] = await Promise.all([
        reporteService.getEmpresasMatriz(),
        reporteService.getKardexList(),
      ])
      setEmpresasMatriz(empresasMatrizRes.data.content)
      setKardexList(kardexRes.data.content)
      
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
      const filtros = {
        empresa_matriz_id: values.empresa_matriz_id,
        kardex: values.kardex,
        anio: values.anio,
        mes_inicio: values.mes_inicio,
        mes_fin: values.mes_fin,
      }

      const response = await reporteService.getComportamientoPrecios(filtros)
      setDatos(response.data.content)
      
      if (response.data.content.length === 0) {
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
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  const handleExportarExcel = () => {
    if (datos.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    const datosExportar = datos.map((item) => {
      const compra = Number(item.precio_compra_promedio)
      const venta = Number(item.precio_venta_promedio)
      const margen = (compra > 0 && venta > 0) ? ((venta - compra) / compra) * 100 : 0
      
      return {
        Año: item.anio,
        Mes: mesesDelAnio.find(m => m.value === item.mes)?.label || item.mes,
        Kardex: item.kardex,
        Descripción: item.descripcion,
        "Precio Compra Prom.": compra > 0 ? compra.toFixed(2) : '-',
        "Precio Venta Prom.": venta > 0 ? venta.toFixed(2) : '-',
        "Margen %": compra > 0 && venta > 0 ? margen.toFixed(1) : '-',
        "Cantidad Comprada": Number(item.cantidad_comprada).toFixed(2),
        "Cantidad Vendida": Number(item.cantidad_vendida).toFixed(2),
        "Variación Compra %": Number(item.variacion_compra).toFixed(2),
        "Variación Venta %": Number(item.variacion_venta).toFixed(2),
      }
    })

    const ws = XLSX.utils.json_to_sheet(datosExportar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Comportamiento Precios")
    
    const nombreArchivo = `comportamiento_precios_${dayjs().format("YYYY-MM-DD")}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
    toast.success("Reporte exportado exitosamente")
  }

  // Generar años disponibles (últimos 5 años + año actual)
  const aniosDisponibles = Array.from({ length: 6 }, (_, i) => {
    const anio = dayjs().year() - i
    return { value: anio, label: anio.toString() }
  })

  const columnas: TableColumnsType<TComportamientoPrecios> = [
    {
      title: "Año",
      dataIndex: "anio",
      key: "anio",
      width: 80,
      align: "center",
    },
    {
      title: "Mes",
      dataIndex: "mes",
      key: "mes",
      width: 120,
      render: (value) => mesesDelAnio.find(m => m.value === value)?.label || value,
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
      width: 200,
    },
    {
      title: "Precio Compra Prom.",
      dataIndex: "precio_compra_promedio",
      key: "precio_compra_promedio",
      align: "right",
      width: 160,
      render: (value) => (
        <span className="text-orange-600 font-semibold">
          {value > 0 ? `S/ ${Number(value).toFixed(2)}` : '-'}
        </span>
      ),
    },
    {
      title: "Precio Venta Prom.",
      dataIndex: "precio_venta_promedio",
      key: "precio_venta_promedio",
      align: "right",
      width: 160,
      render: (value) => (
        <span className="text-green-600 font-semibold">
          {value > 0 ? `S/ ${Number(value).toFixed(2)}` : '-'}
        </span>
      ),
    },
    {
      title: "Margen",
      key: "margen",
      align: "right",
      width: 120,
      render: (_, record) => {
        const compra = Number(record.precio_compra_promedio)
        const venta = Number(record.precio_venta_promedio)
        if (compra > 0 && venta > 0) {
          const margen = ((venta - compra) / compra) * 100
          return (
            <span className={`font-semibold ${margen > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margen > 0 ? '+' : ''}{margen.toFixed(1)}%
            </span>
          )
        }
        return '-'
      },
    },
    {
      title: "Cant. Comprada",
      dataIndex: "cantidad_comprada",
      key: "cantidad_comprada",
      align: "right",
      width: 130,
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "Cant. Vendida",
      dataIndex: "cantidad_vendida",
      key: "cantidad_vendida",
      align: "right",
      width: 130,
      render: (value) => Number(value).toFixed(2),
    },
    {
      title: "Var. Compra",
      dataIndex: "variacion_compra",
      key: "variacion_compra",
      align: "center",
      width: 120,
      render: (value) => {
        const isPositive = value > 0
        return (
          <Tag
            color={isPositive ? "red" : value < 0 ? "green" : "default"}
            icon={
              isPositive ? (
                <ArrowUpOutlined />
              ) : value < 0 ? (
                <ArrowDownOutlined />
              ) : null
            }
          >
            {value > 0 ? "+" : ""}
            {Number(value).toFixed(2)}%
          </Tag>
        )
      },
    },
    {
      title: "Var. Venta",
      dataIndex: "variacion_venta",
      key: "variacion_venta",
      align: "center",
      width: 120,
      render: (value) => {
        const isPositive = value > 0
        return (
          <Tag
            color={isPositive ? "green" : value < 0 ? "red" : "default"}
            icon={
              isPositive ? (
                <ArrowUpOutlined />
              ) : value < 0 ? (
                <ArrowDownOutlined />
              ) : null
            }
          >
            {value > 0 ? "+" : ""}
            {Number(value).toFixed(2)}%
          </Tag>
        )
      },
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LineChartOutlined className="text-purple-600" />
          Comportamiento de Precios
        </h1>
        <p className="text-gray-600">
          Analiza la evolución de precios de compra y venta por mes/año
        </p>
      </div>

      <Card className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerarReporte}
          initialValues={{
            anio: dayjs().year(),
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            <Form.Item label="Kardex" name="kardex">
              <Select
                placeholder="Todos los kardex"
                showSearch
                allowClear
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={kardexList.map((k) => ({
                  label: `${k.kardex} - ${k.descripcion}`,
                  value: k.kardex,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Año"
              name="anio"
              rules={[{ required: true, message: "Selecciona el año" }]}
            >
              <Select
                placeholder="Seleccionar año"
                options={aniosDisponibles}
              />
            </Form.Item>

            <Form.Item label="Mes Inicio" name="mes_inicio">
              <Select
                placeholder="Todos"
                allowClear
                options={mesesDelAnio}
              />
            </Form.Item>

            <Form.Item label="Mes Fin" name="mes_fin">
              <Select
                placeholder="Todos"
                allowClear
                options={mesesDelAnio}
              />
            </Form.Item>

            <Form.Item label=" " className="mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={cargando}
                >
                  Generar
                </Button>
                {datos.length > 0 && (
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

      {!cargando && datos.length > 0 && (
        <Card title={`Comportamiento de Precios (${datos.length} registros)`}>
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ℹ️ Variación Compra:</span>
                <p className="mt-1">
                  <Tag color="red" icon={<ArrowUpOutlined />}>Aumento</Tag>
                  <Tag color="green" icon={<ArrowDownOutlined />}>Disminución</Tag>
                </p>
              </div>
              <div>
                <span className="text-gray-600">ℹ️ Variación Venta:</span>
                <p className="mt-1">
                  <Tag color="green" icon={<ArrowUpOutlined />}>Aumento</Tag>
                  <Tag color="red" icon={<ArrowDownOutlined />}>Disminución</Tag>
                </p>
              </div>
              <div>
                <span className="text-gray-600">💰 Margen:</span>
                <p className="mt-1 text-xs">
                  <span className="text-green-600">Positivo</span> = Ganancia<br/>
                  <span className="text-red-600">Negativo</span> = Pérdida
                </p>
              </div>
              <div>
                <span className="text-gray-600">📊 Comparación:</span>
                <p className="mt-1 text-xs">
                  Las variaciones se calculan respecto al mes anterior
                </p>
              </div>
            </div>
          </div>

          <Table
            columns={columnas}
            dataSource={datos}
            rowKey={(record) => `${record.kardex}-${record.anio}-${record.mes}`}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} registros`,
            }}
            scroll={{ x: 1500 }}
          />
        </Card>
      )}

      {!cargando && datos.length === 0 && (
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

export default ComportamientoPreciosPage
