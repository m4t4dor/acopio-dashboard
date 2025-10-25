import { Modal, DatePicker, Input, InputNumber, Select } from "antd"
import { TSaldoKardex } from "@/types/liquidacion"
import { TCliente } from "@/types"
import type { Dayjs } from "dayjs"
import { useState, useEffect } from "react"
import { getClientes } from "@/pages/clientes/clientes.service"
import { SearchOutlined } from "@ant-design/icons"

interface ModalRegistrarSalidaProps {
  visible: boolean
  kardexSeleccionado: string
  saldos: TSaldoKardex[]
  nuevaSalida: {
    fecha: Dayjs
    proveedor: string
    ruc_dni: string
    cantidad_salida: number
    costo_unitario: number
  }
  setNuevaSalida: React.Dispatch<
    React.SetStateAction<{
      fecha: Dayjs
      proveedor: string
      ruc_dni: string
      cantidad_salida: number
      costo_unitario: number
    }>
  >
  onGuardar: () => void
  onCancelar: () => void
}

const ModalRegistrarSalida: React.FC<ModalRegistrarSalidaProps> = ({
  visible,
  kardexSeleccionado,
  saldos,
  nuevaSalida,
  setNuevaSalida,
  onGuardar,
  onCancelar,
}) => {
  const saldo = saldos.find((s) => s.kardex === kardexSeleccionado)
  const [clientes, setClientes] = useState<TCliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [buscarCliente, setBuscarCliente] = useState("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (visible) {
      cargarClientes()
    } else {
      // Limpiar el select cuando se cierra el modal
      setClienteSeleccionado(undefined)
      setBuscarCliente("")
    }
  }, [visible])

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true)
      const response = await getClientes({
        page: 1,
        per_page: 100,
        filtros: { buscar: buscarCliente },
      })
      setClientes(response.data.content.clientes.data || [])
    } catch (error) {
      console.error("Error al cargar clientes:", error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const handleSearchClientes = (value: string) => {
    setBuscarCliente(value)
  }

  useEffect(() => {
    if (visible && buscarCliente.length > 0) {
      const timer = setTimeout(() => {
        cargarClientes()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [buscarCliente])

  const handleSelectCliente = (value: number) => {
    const cliente = clientes.find((c) => c.id === value)
    if (cliente) {
      setClienteSeleccionado(value)
      setNuevaSalida({
        ...nuevaSalida,
        proveedor: cliente.nombre_mostrar,
        ruc_dni: cliente.documento_numero,
      })
    }
  }

  const handleClearCliente = () => {
    setClienteSeleccionado(undefined)
    setBuscarCliente("")
  }

  return (
    <Modal
      title={`Registrar Salida - Empresa: ${kardexSeleccionado}`}
      open={visible}
      centered
      onCancel={onCancelar}
      onOk={onGuardar}
      okText="Registrar Salida"
      cancelText="Cancelar"
      width={700}
    >
      {saldo && (
        <div className="space-y-3">
          {/* Información del Stock */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="col-span-2">
              <p className="text-xs text-gray-600">Stock para</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{saldo.descripcion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Disponible para Venta</p>
              <p className="text-xl font-bold text-green-600">{saldo.saldo_pendiente} kg</p>
              <p className="text-xs text-gray-500">había en {nuevaSalida.fecha.format("DD/MM/YYYY")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Costo Promedio</p>
              <p className="text-xl font-bold text-gray-800">S/ {saldo.costo_promedio.toFixed(5)}</p>
              <p className="text-xs text-gray-500">costo promedio</p>
            </div>
          </div>

          {/* Información de Venta */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Cantidad</p>
                <p className="text-lg font-bold text-gray-800">{nuevaSalida.cantidad_salida.toFixed(2)} kg</p>
                <p className="text-xs text-gray-500">cantidad</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Precio/kg</p>
                <p className="text-lg font-bold text-gray-800">S/ {nuevaSalida.costo_unitario.toFixed(5)}</p>
                <p className="text-xs text-gray-500">precio/kg</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600">Total de Venta</p>
                <p className="text-2xl font-bold text-purple-600">
                  S/ {(nuevaSalida.cantidad_salida * nuevaSalida.costo_unitario).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600">Costo base: S/ {nuevaSalida.costo_unitario.toFixed(5)} por kg</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Seleccionar Kardex
              </label>
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm font-semibold">{saldo.kardex}</p>
                <p className="text-xs text-gray-500 truncate">{saldo.descripcion}</p>
                <p className="text-xs text-green-600">✓ Disponible</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Fecha de Salida
              </label>
              <DatePicker
                value={nuevaSalida.fecha}
                onChange={(date) => setNuevaSalida({ ...nuevaSalida, fecha: date || nuevaSalida.fecha })}
                format="DD/MM/YYYY"
                className="w-full"
                size="middle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Cantidad a Vender (kg)
              </label>
              <InputNumber
                value={nuevaSalida.cantidad_salida}
                onChange={(value) =>
                  setNuevaSalida({ ...nuevaSalida, cantidad_salida: value || 0 })
                }
                min={0}
                max={saldo.saldo_pendiente}
                className="w-full"
                size="middle"
                suffix="kg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Precio Unitario de Venta
              </label>
              <InputNumber
                value={nuevaSalida.costo_unitario}
                onChange={(value) =>
                  setNuevaSalida({ ...nuevaSalida, costo_unitario: value || 0 })
                }
                min={0}
                precision={5}
                className="w-full"
                size="middle"
                addonBefore="S/"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                * Cliente
              </label>
              <Select
                showSearch
                allowClear
                value={clienteSeleccionado}
                placeholder="Buscar cliente"
                suffixIcon={<SearchOutlined />}
                filterOption={false}
                onSearch={handleSearchClientes}
                onChange={handleSelectCliente}
                onClear={handleClearCliente}
                loading={loadingClientes}
                className="w-full"
                size="middle"
                notFoundContent={loadingClientes ? "Cargando..." : "No se encontraron clientes"}
                options={clientes.map((cliente) => ({
                  value: cliente.id,
                  label: `${cliente.nombre_mostrar} - ${cliente.documento_tipo.toUpperCase()}: ${cliente.documento_numero}`,
                }))}
              />
            </div>

            <div className="col-span-2">
              <Input
                value={nuevaSalida.proveedor}
                onChange={(e) => setNuevaSalida({ ...nuevaSalida, proveedor: e.target.value })}
                placeholder="Nombre del cliente"
                size="middle"
              />
            </div>

            <div className="col-span-2">
              <Input
                value={nuevaSalida.ruc_dni}
                onChange={(e) => setNuevaSalida({ ...nuevaSalida, ruc_dni: e.target.value })}
                placeholder="RUC o DNI"
                size="middle"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ModalRegistrarSalida
