import { Modal, Alert, DatePicker, Input, InputNumber, Select } from "antd"
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
      title={`Registrar Salida - KARDEX ${kardexSeleccionado}`}
      open={visible}
      centered
      onCancel={onCancelar}
      onOk={onGuardar}
      okText="Registrar Salida"
      cancelText="Cancelar"
    >
      {saldo && (
        <div className="space-y-4">
          <Alert
            description={
              <div className="space-y-2">
                <p>
                  <strong>Descripción:</strong> {saldo.descripcion}
                </p>
                <p>
                  <strong>Saldo Pendiente:</strong> {saldo.saldo_pendiente} unidades
                </p>
                <p>
                  <strong>Costo Promedio:</strong> S/ {saldo.costo_promedio.toFixed(2)}
                </p>
                <p className="text-orange-600 text-base">
                  <strong>Total a Vender:</strong> S/{" "}
                  {(nuevaSalida.cantidad_salida * nuevaSalida.costo_unitario).toFixed(2)}
                </p>
              </div>
            }
            type="info"
            showIcon
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Salida
            </label>
            <DatePicker
              value={nuevaSalida.fecha}
              onChange={(date) => setNuevaSalida({ ...nuevaSalida, fecha: date || nuevaSalida.fecha })}
              format="DD/MM/YYYY"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente/Proveedor *
            </label>
            <Select
              showSearch
              allowClear
              value={clienteSeleccionado}
              placeholder="Buscar y seleccionar cliente"
              suffixIcon={<SearchOutlined />}
              filterOption={false}
              onSearch={handleSearchClientes}
              onChange={handleSelectCliente}
              onClear={handleClearCliente}
              loading={loadingClientes}
              className="w-full"
              notFoundContent={loadingClientes ? "Cargando..." : "No se encontraron clientes"}
              options={clientes.map((cliente) => ({
                value: cliente.id,
                label: `${cliente.nombre_mostrar} - ${cliente.documento_tipo.toUpperCase()}: ${cliente.documento_numero}`,
              }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              O ingresa manualmente el nombre del cliente abajo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <Input
              value={nuevaSalida.proveedor}
              onChange={(e) => setNuevaSalida({ ...nuevaSalida, proveedor: e.target.value })}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC/DNI *</label>
            <Input
              value={nuevaSalida.ruc_dni}
              onChange={(e) => setNuevaSalida({ ...nuevaSalida, ruc_dni: e.target.value })}
              placeholder="RUC o DNI del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de Salida *
            </label>
            <InputNumber
              value={nuevaSalida.cantidad_salida}
              onChange={(value) =>
                setNuevaSalida({ ...nuevaSalida, cantidad_salida: value || 0 })
              }
              min={0}
              max={saldo.saldo_pendiente}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo disponible: {saldo.saldo_pendiente} unidades
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo Unitario * 
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Sugerido: S/ {saldo.costo_promedio.toFixed(2)})
              </span>
            </label>
            <InputNumber
              value={nuevaSalida.costo_unitario}
              onChange={(value) =>
                setNuevaSalida({ ...nuevaSalida, costo_unitario: value || 0 })
              }
              min={0}
              precision={2}
              className="w-full"
              addonBefore="S/"
            />
            <p className="text-xs text-blue-600 mt-1">
              Puedes modificar el costo unitario según sea necesario
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ModalRegistrarSalida
