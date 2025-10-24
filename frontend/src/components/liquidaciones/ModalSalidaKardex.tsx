import React, { useState, useEffect } from "react"
import { Modal, Form, Input, DatePicker, Button, Card, Typography, Statistic, AutoComplete, Select } from "antd"
import { DollarOutlined, StockOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { TLiquidacion, TCliente } from "@/types"
import * as clientesService from "@/pages/clientes/clientes.service"

const { Title, Text } = Typography
const { Option } = Select

interface ModalSalidaKardexProps {
  visible: boolean
  onClose: () => void
  onRegistrarSalida: (datosSalida: DatosSalida) => void
  numeroDocumentoEmpresa: string
  liquidaciones: TLiquidacion[]
  fechaSeleccionada?: string
}

interface DatosSalida {
  kardex: string
  fecha: string
  cantidad: number
  precioUnitario: number
  total: number
  cliente?: TCliente
}

interface StockInfo {
  stockDisponible: number
  costoPromedio: number
  valorStock: number
  fechaCalculada: string
}

const ModalSalidaKardex: React.FC<ModalSalidaKardexProps> = ({
  visible,
  onClose,
  onRegistrarSalida,
  numeroDocumentoEmpresa,
  liquidaciones,
  fechaSeleccionada,
}) => {
  const [form] = Form.useForm()
  const [stockInfo, setStockInfo] = useState<StockInfo>({
    stockDisponible: 0,
    costoPromedio: 0,
    valorStock: 0,
    fechaCalculada: ""
  })
  const [clientes, setClientes] = useState<TCliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<TCliente | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState<string>("")
  const [cargandoClientes, setCargandoClientes] = useState<boolean>(false)
  const [precioUnitario, setPrecioUnitario] = useState(0)
  const [cantidad, setCantidad] = useState(0)
  const [esClienteNuevo, setEsClienteNuevo] = useState<boolean>(false)
  const [tipoDocumento, setTipoDocumento] = useState<'dni' | 'ruc' | 'carnet_extranjeria' | 'pasaporte'>('dni')
  const [numeroDocumento, setNumeroDocumento] = useState<string>("")
  const [kardexSeleccionado, setKardexSeleccionado] = useState<string>("")
  const [kardexDisponibles, setKardexDisponibles] = useState<Array<{codigo: string, descripcion: string}>>([])

  // Obtener kardex disponibles para la empresa
  const obtenerKardexDisponibles = () => {
    const liquidacionesEmpresa = liquidaciones.filter(liq => 
      liq.numero_documento === numeroDocumentoEmpresa
    )
    
    const kardexUnicos = new Map<string, string>()
    
    liquidacionesEmpresa.forEach(liq => {
      liq.items.forEach(item => {
        if (item.kardex && !kardexUnicos.has(item.kardex)) {
          kardexUnicos.set(item.kardex, item.descripcion || `Kardex ${item.kardex}`)
        }
      })
    })
    
    return Array.from(kardexUnicos.entries()).map(([codigo, descripcion]) => ({
      codigo,
      descripcion
    }))
  }

  // Función para calcular el stock en una fecha específica
  const calcularStockEnFecha = (fecha: string, kardex: string): StockInfo => {
    if (!kardex) {
      return {
        stockDisponible: 0,
        costoPromedio: 0,
        valorStock: 0,
        fechaCalculada: fecha
      }
    }

    // Filtrar liquidaciones por empresa
    const liquidacionesDelKardex = liquidaciones.filter(liq => 
      liq.numero_documento === numeroDocumentoEmpresa
    )

    if (liquidacionesDelKardex.length === 0) {
      return {
        stockDisponible: 0,
        costoPromedio: 0,
        valorStock: 0,
        fechaCalculada: fecha
      }
    }

    // Usar la misma función que usa la tabla para generar movimientos
    const movimientosKardex = generarMovimientosKardex(liquidacionesDelKardex)
    
    // Filtrar movimientos del kardex específico hasta la fecha seleccionada
    const movimientosDelKardexEnFecha = movimientosKardex.filter(mov => {
      const fechaMovimiento = dayjs(mov.fecha, 'DD/MM/YYYY').format('YYYY-MM-DD')
      const fechaComparacion = dayjs(fecha).format('YYYY-MM-DD')
      return mov.archivo && mov.archivo.includes(kardex) && fechaMovimiento <= fechaComparacion
    })

    // Si no hay movimientos, retornar ceros
    if (movimientosDelKardexEnFecha.length === 0) {
      return {
        stockDisponible: 0,
        costoPromedio: 0,
        valorStock: 0,
        fechaCalculada: fecha
      }
    }

    // Obtener el último movimiento (el stock actual)
    const ultimoMovimiento = movimientosDelKardexEnFecha[movimientosDelKardexEnFecha.length - 1]

    return {
      stockDisponible: Math.max(0, ultimoMovimiento.stockActual || 0),
      costoPromedio: ultimoMovimiento.costoPromedio || 0,
      valorStock: Math.max(0, ultimoMovimiento.valorStock || 0),
      fechaCalculada: fecha
    }
  }

  // Función auxiliar para generar movimientos (copia de la función de la tabla principal)
  const generarMovimientosKardex = (liquidaciones: TLiquidacion[]) => {
    const movimientos: any[] = []
    let stockAcumulado = 0
    let valorInventario = 0
    let costoPromedioPonderado = 0

    // Obtener todos los items de todas las liquidaciones
    const todosLosItems = liquidaciones.flatMap(liq => 
      liq.items.map(item => ({
        ...item,
        liquidacion_id: liq.id,
        archivo: liq.nombre_archivo
      }))
    )

    // Ordenar items cronológicamente
    const itemsOrdenados = todosLosItems.sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha)
      }
      return (a.id || 0) - (b.id || 0)
    })

    // Procesar cada item individual como un movimiento
    itemsOrdenados.forEach((item, index) => {
      const cantidadIngreso = Number(item.ingreso) || 0
      const cantidadSalida = Number(item.salida) || 0
      const costoUnitario = Number(item.costo_unitario) || 0
      const totalItem = Number(item.total) || 0

      // Procesar ingresos
      if (cantidadIngreso > 0) {
        const nuevoValorInventario = valorInventario + (cantidadIngreso * costoUnitario)
        const nuevoStock = stockAcumulado + cantidadIngreso
        costoPromedioPonderado = nuevoStock > 0 ? nuevoValorInventario / nuevoStock : 0
        
        stockAcumulado = nuevoStock
        valorInventario = nuevoValorInventario
      }

      // Procesar salidas
      if (cantidadSalida > 0) {
        stockAcumulado -= cantidadSalida
        valorInventario = stockAcumulado * costoPromedioPonderado
      }

      movimientos.push({
        key: `${item.fecha}-${item.kardex}-${item.id}`,
        fecha: item.fecha,
        archivo: item.archivo,
        descripcion: item.descripcion,
        proveedor: item.proveedor,
        kardex: item.kardex,
        // Ingreso
        cantidadIngreso: cantidadIngreso,
        costoIngreso: costoUnitario,
        totalIngreso: totalItem,
        // Salida
        cantidadSalida: cantidadSalida,
        costoSalida: costoPromedioPonderado,
        totalSalida: cantidadSalida * costoPromedioPonderado,
        // Stock
        stockActual: stockAcumulado,
        costoPromedio: costoPromedioPonderado,
        valorStock: valorInventario,
        // Metadata
        tipo: cantidadIngreso > 0 ? 'ingreso' : 'salida',
        esCorte: cantidadSalida > 0,
        index
      })
    })

    return movimientos
  }

  // Calcular precio unitario sugerido basado en costo promedio
  const calcularPrecioSugerido = (costoPromedio: number): number => {
    // Usar directamente el costo promedio sin margen adicional
    return costoPromedio
  }

  // Actualizar stock info cuando cambia la fecha o kardex
  useEffect(() => {
    const fechaFormulario = form.getFieldValue('fecha')
    if (fechaFormulario && kardexSeleccionado) {
      const fechaStr = dayjs(fechaFormulario).format('YYYY-MM-DD')
      const info = calcularStockEnFecha(fechaStr, kardexSeleccionado)
      setStockInfo(info)
      
      // Solo sugerir precio si hay stock disponible
      if (info.stockDisponible > 0 && info.costoPromedio > 0) {
        const precioSugerido = calcularPrecioSugerido(info.costoPromedio)
        setPrecioUnitario(precioSugerido)
        form.setFieldsValue({ precio_unitario: precioSugerido.toFixed(4) })
      } else {
        // Si no hay stock, limpiar precio
        setPrecioUnitario(0)
        form.setFieldsValue({ precio_unitario: '0.0000' })
      }
      
      // Limpiar cantidad si no hay stock
      if (info.stockDisponible <= 0) {
        setCantidad(0)
        form.setFieldsValue({ cantidad: '', total: '0.00' })
      }
    }
  }, [form, kardexSeleccionado, liquidaciones, numeroDocumentoEmpresa])

  // Función para cargar clientes
  const cargarClientes = async (busqueda: string = "") => {
    setCargandoClientes(true)
    try {
      const response = await clientesService.getClientes({
        page: 1,
        per_page: 20,
        filtros: { buscar: busqueda }
      })
      setClientes(response.data.content.clientes.data)
    } catch (error) {
      console.error("Error al cargar clientes:", error)
      setClientes([])
    } finally {
      setCargandoClientes(false)
    }
  }

  // Función para manejar selección de cliente
  const handleClienteSelect = (value: string) => {
    const cliente = clientes.find(c => c.id.toString() === value)
    if (cliente) {
      setClienteSeleccionado(cliente)
      setBusquedaCliente(cliente.nombre_mostrar)
      setEsClienteNuevo(false)
      form.setFieldsValue({ cliente: cliente.nombre_mostrar })
    }
  }

  // Función para buscar clientes
  const handleBusquedaCliente = (value: string) => {
    setBusquedaCliente(value)
    if (value.length >= 2) {
      cargarClientes(value)
    }
  }

  // Inicializar con fecha actual si se proporciona
  useEffect(() => {
    if (visible) {
      const fechaInicial = fechaSeleccionada || dayjs().format('YYYY-MM-DD')
      
      // Obtener kardex disponibles
      const kardexOpciones = obtenerKardexDisponibles()
      setKardexDisponibles(kardexOpciones)
      
      // Seleccionar el primer kardex por defecto si hay opciones
      const kardexInicial = kardexOpciones.length > 0 ? kardexOpciones[0].codigo : ''
      setKardexSeleccionado(kardexInicial)
      
      form.setFieldsValue({
        fecha: dayjs(fechaInicial),
        kardex: kardexInicial,
        cliente: '',
        tipo_documento: 'dni',
        numero_documento: ''
      })

      // Limpiar estado de cliente
      setClienteSeleccionado(null)
      setBusquedaCliente('')
      setEsClienteNuevo(false)
      setTipoDocumento('dni')
      setNumeroDocumento('')

      // Cargar clientes iniciales
      cargarClientes()
      
      // Calcular stock inicial si hay kardex seleccionado
      if (kardexInicial) {
        const info = calcularStockEnFecha(fechaInicial, kardexInicial)
        setStockInfo(info)
        
        if (info.stockDisponible > 0 && info.costoPromedio > 0) {
          const precioSugerido = calcularPrecioSugerido(info.costoPromedio)
          setPrecioUnitario(precioSugerido)
          form.setFieldsValue({ precio_unitario: precioSugerido.toFixed(4) })
        }
      }
    }
  }, [visible, fechaSeleccionada, numeroDocumentoEmpresa, liquidaciones])

  const handleSubmit = async (values: any) => {
    try {
      let clienteFinal = clienteSeleccionado

      // Si es un cliente nuevo, crear el objeto con la información completa
      if (esClienteNuevo && busquedaCliente && numeroDocumento) {
        clienteFinal = {
          id: Date.now(), // ID temporal
          documento_tipo: tipoDocumento,
          documento_numero: numeroDocumento,
          nombres: busquedaCliente,
          nombre_comercial: null,
          telefono: null,
          direccion: null,
          sucursal_id: 1,
          nombre_mostrar: busquedaCliente,
          documento_completo: `${tipoDocumento.toUpperCase()}: ${numeroDocumento}`,
          telefono_principal: null,
          telefonos_alternativos: [],
          created_at: new Date().toISOString(),
          updated_at: null,
          deleted_at: null
        }
      }

      const datosSalida: DatosSalida = {
        kardex: kardexSeleccionado,
        fecha: dayjs(values.fecha).format('DD/MM/YYYY'),
        cantidad: parseFloat(values.cantidad),
        precioUnitario: parseFloat(values.precio_unitario),
        total: parseFloat(values.cantidad) * parseFloat(values.precio_unitario),
        cliente: clienteFinal || undefined
      }

      // Llamar a la función de registro y esperar a que termine
      await onRegistrarSalida(datosSalida)

      // Solo limpiar y cerrar si no hubo errores
      form.resetFields()
      setClienteSeleccionado(null)
      setBusquedaCliente('')
      setEsClienteNuevo(false)
      setTipoDocumento('dni')
      setNumeroDocumento('')
      onClose()
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      // No cerrar el modal si hay error para que el usuario pueda ver qué pasó
    }
  }

  const handleFechaChange = (fecha: any) => {
    if (fecha && kardexSeleccionado) {
      const fechaStr = dayjs(fecha).format('YYYY-MM-DD')
      const info = calcularStockEnFecha(fechaStr, kardexSeleccionado)
      setStockInfo(info)
      
      // Recalcular precio sugerido basado en el stock de esa fecha
      if (info.stockDisponible > 0 && info.costoPromedio > 0) {
        const precioSugerido = calcularPrecioSugerido(info.costoPromedio)
        setPrecioUnitario(precioSugerido)
        form.setFieldsValue({ precio_unitario: precioSugerido.toFixed(4) })
      } else {
        setPrecioUnitario(0)
        form.setFieldsValue({ precio_unitario: '0.0000' })
      }
      
      // Recalcular total si ya hay cantidad ingresada
      const cantidadActual = form.getFieldValue('cantidad')
      if (cantidadActual && info.costoPromedio > 0) {
        const precioSugerido = calcularPrecioSugerido(info.costoPromedio)
        form.setFieldsValue({
          total: (parseFloat(cantidadActual) * precioSugerido).toFixed(2)
        })
      }
    }
  }

  const handleCantidadChange = (valor: string) => {
    const cantidadNum = parseFloat(valor) || 0
    setCantidad(cantidadNum)
    form.setFieldsValue({
      total: (cantidadNum * precioUnitario).toFixed(2)
    })
  }

  const handlePrecioChange = (valor: string) => {
    const precioNum = parseFloat(valor) || 0
    setPrecioUnitario(precioNum)
    form.setFieldsValue({
      total: (cantidad * precioNum).toFixed(2)
    })
  }

  const handleKardexChange = (valor: string) => {
    setKardexSeleccionado(valor)
    form.setFieldsValue({ kardex: valor })
    
    // Recalcular stock con el nuevo kardex
    const fechaFormulario = form.getFieldValue('fecha')
    if (fechaFormulario) {
      const fechaStr = dayjs(fechaFormulario).format('YYYY-MM-DD')
      const info = calcularStockEnFecha(fechaStr, valor)
      setStockInfo(info)
      
      // Recalcular precio y limpiar cantidad
      if (info.stockDisponible > 0 && info.costoPromedio > 0) {
        const precioSugerido = calcularPrecioSugerido(info.costoPromedio)
        setPrecioUnitario(precioSugerido)
        form.setFieldsValue({ 
          precio_unitario: precioSugerido.toFixed(4),
          cantidad: '',
          total: '0.00'
        })
      } else {
        setPrecioUnitario(0)
        form.setFieldsValue({ 
          precio_unitario: '0.0000',
          cantidad: '',
          total: '0.00'
        })
      }
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <StockOutlined className="text-red-500" />
          <span>Registrar Salida - Empresa: {numeroDocumentoEmpresa}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="modal-salida-kardex"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Información de Stock */}
        <Card size="small" className={`${stockInfo.stockDisponible > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
          <Title level={5} className={`${stockInfo.stockDisponible > 0 ? 'text-blue-700' : 'text-red-700'} mb-3`}>
            📊 Stock en Fecha: {dayjs(stockInfo.fechaCalculada).format('DD/MM/YYYY')}
          </Title>
          <div className="space-y-2">
            <Statistic
              title="Cantidad Disponible"
              value={stockInfo.stockDisponible}
              suffix="kg"
              valueStyle={{ 
                color: stockInfo.stockDisponible > 0 ? '#1890ff' : '#ff4d4f', 
                fontSize: '16px' 
              }}
            />
            {stockInfo.stockDisponible > 0 ? (
              <>
                <Statistic
                  title="Costo Promedio"
                  value={stockInfo.costoPromedio}
                  prefix="S/ "
                  precision={4}
                  valueStyle={{ fontSize: '14px' }}
                />
                <Statistic
                  title="Valor Total Stock"
                  value={stockInfo.valorStock}
                  prefix="S/ "
                  precision={2}
                  valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                />
              </>
            ) : (
              <div className="text-red-500 text-sm mt-2">
                ⚠️ No hay stock disponible en esta fecha
              </div>
            )}
          </div>
        </Card>

        {/* Información de Venta */}
        <Card size="small" className={`${precioUnitario > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
          <Title level={5} className={`${precioUnitario > 0 ? 'text-green-700' : 'text-gray-700'} mb-3`}>
            💰 Información de Venta
          </Title>
          <div className="space-y-2">
            {precioUnitario > 0 ? (
              <>
                <Statistic
                  title="Precio de Venta"
                  value={precioUnitario}
                  prefix="S/ "
                  precision={4}
                  valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                />
                <div className="text-xs text-gray-600">
                  <Text type="secondary">
                    Precio basado en costo promedio de la fecha
                  </Text>
                </div>
                {stockInfo.costoPromedio > 0 && (
                  <div className="text-xs text-blue-600">
                    <Text>
                      Costo base: S/ {stockInfo.costoPromedio.toFixed(4)}
                    </Text>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm">
                ℹ️ Seleccione una fecha con stock disponible
              </div>
            )}
          </div>
        </Card>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Form.Item
          name="kardex"
          label="Seleccionar Kardex"
          rules={[{ required: true, message: 'Seleccione un kardex' }]}
          className="mb-4"
        >
          <Select
            placeholder="Seleccione el kardex del producto"
            value={kardexSeleccionado}
            onChange={handleKardexChange}
            showSearch
            optionFilterProp="children"
          >
            {kardexDisponibles.map(kardex => (
              <Option key={kardex.codigo} value={kardex.codigo}>
                <div>
                  <div className="font-medium">Kardex: {kardex.codigo}</div>
                  <div className="text-sm text-gray-500">{kardex.descripcion}</div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="fecha"
            label="Fecha de Salida"
            rules={[{ required: true, message: 'Seleccione la fecha' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              className="w-full"
              placeholder="Seleccionar fecha"
              allowClear={false}
              onChange={handleFechaChange}
            />
          </Form.Item>

          <Form.Item
            name="cantidad"
            label="Cantidad a Vender (kg)"
            rules={[
              { required: true, message: 'Ingrese la cantidad' },
              {
                validator: (_, value) => {
                  if (!value || parseFloat(value) <= 0) {
                    return Promise.reject('La cantidad debe ser mayor a 0')
                  }
                  if (parseFloat(value) > stockInfo.stockDisponible) {
                    return Promise.reject('La cantidad no puede exceder el stock disponible')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              onChange={(e) => handleCantidadChange(e.target.value)}
              suffix="kg"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="precio_unitario"
            label="Precio Unitario de Venta"
            rules={[
              { required: true, message: 'Ingrese el precio unitario' },
              {
                validator: (_, value) => {
                  if (!value || parseFloat(value) <= 0) {
                    return Promise.reject('El precio unitario debe ser mayor a 0')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input
              type="number"
              step="0.0001"
              placeholder="0.0000"
              onChange={(e) => handlePrecioChange(e.target.value)}
              prefix="S/ "
            />
          </Form.Item>

          <Form.Item
            name="total"
            label="Total de Venta"
          >
            <Input
              prefix="S/ "
              readOnly
              className="bg-gray-50"
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Cliente"
          name="cliente"
          rules={[{ required: true, message: 'Seleccione o agregue un cliente' }]}
          className="mb-3"
        >
          <div>
            <AutoComplete
              placeholder="Buscar cliente existente o escribir nuevo nombre"
              onSearch={handleBusquedaCliente}
              onSelect={handleClienteSelect}
              value={busquedaCliente}
              onChange={(value) => {
                setBusquedaCliente(value)
                const clienteExistente = clientes.find(c => 
                  c.nombre_mostrar.toLowerCase().includes(value.toLowerCase()) ||
                  c.documento_numero.includes(value)
                )
                
                if (!clienteExistente && value) {
                  // Es un cliente nuevo
                  setEsClienteNuevo(true)
                  setClienteSeleccionado(null)
                } else if (clienteExistente) {
                  // Es un cliente existente
                  setEsClienteNuevo(false)
                  setClienteSeleccionado(clienteExistente)
                } else {
                  // Campo vacío
                  setEsClienteNuevo(false)
                  setClienteSeleccionado(null)
                }
              }}
              options={clientes.map(cliente => ({
                value: cliente.id.toString(),
                label: (
                  <div>
                    <div className="font-medium">{cliente.nombre_mostrar}</div>
                    <div className="text-sm text-gray-500">{cliente.documento_completo}</div>
                  </div>
                )
              }))}
              notFoundContent={cargandoClientes ? "Cargando clientes..." : "No se encontraron clientes"}
            />
            
            {/* Campos adicionales para cliente nuevo */}
            {esClienteNuevo && busquedaCliente && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <Text className="text-sm text-orange-700 font-medium block mb-2">
                  📝 Nuevo Cliente: {busquedaCliente}
                </Text>
                
                <div className="grid grid-cols-2 gap-3">
                  <Form.Item
                    label="Tipo de Documento"
                    name="tipo_documento"
                    rules={[{ required: esClienteNuevo, message: 'Seleccione el tipo' }]}
                    className="mb-2"
                  >
                    <Select
                      value={tipoDocumento}
                      onChange={setTipoDocumento}
                      placeholder="Seleccionar tipo"
                    >
                      <Option value="dni">DNI</Option>
                      <Option value="ruc">RUC</Option>
                      <Option value="carnet_extranjeria">Carnet de Extranjería</Option>
                      <Option value="pasaporte">Pasaporte</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label="Número de Documento"
                    name="numero_documento"
                    rules={[
                      { required: esClienteNuevo, message: 'Ingrese el número' },
                      {
                        validator: (_, value) => {
                          if (!esClienteNuevo) return Promise.resolve()
                          if (!value) return Promise.reject('Número requerido')
                          
                          if (tipoDocumento === 'dni' && value.length !== 8) {
                            return Promise.reject('DNI debe tener 8 dígitos')
                          }
                          if (tipoDocumento === 'ruc' && value.length !== 11) {
                            return Promise.reject('RUC debe tener 11 dígitos')
                          }
                          return Promise.resolve()
                        }
                      }
                    ]}
                    className="mb-2"
                  >
                    <Input
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value)}
                      placeholder={tipoDocumento === 'dni' ? '12345678' : tipoDocumento === 'ruc' ? '12345678901' : 'Número'}
                      maxLength={tipoDocumento === 'dni' ? 8 : tipoDocumento === 'ruc' ? 11 : 20}
                    />
                  </Form.Item>
                </div>
              </div>
            )}
            
            {/* Información del cliente seleccionado */}
            {clienteSeleccionado && !esClienteNuevo && (
              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                <Text className="text-sm text-green-600">
                  ✅ Cliente registrado: <strong>{clienteSeleccionado.nombre_mostrar}</strong> - {clienteSeleccionado.documento_completo}
                </Text>
              </div>
            )}
          </div>
        </Form.Item>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<DollarOutlined />}
            className="bg-red-500 hover:bg-red-600"
          >
            Registrar Salida
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default ModalSalidaKardex