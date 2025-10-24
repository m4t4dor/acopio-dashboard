import { useState, useEffect, useMemo } from "react"
import {
  InboxOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  TableOutlined,
  StockOutlined,
} from "@ant-design/icons"
import {
  Button,
  Table,
  Upload,
  Card,
  message,
  Modal,
  Spin,
  Input,
  Select,
  Tooltip,
} from "antd"
import type { UploadProps, TableColumnsType } from "antd"
import { TItemLiquidacion, TLiquidacion } from "@/types/liquidacion"
import { procesarPDFCompleto } from "@/utils/pdfProcessor"
import * as liquidacionService from "@/services/liquidacionService"
import toast from "react-hot-toast"
import ResponsiveContainer from "@/components/ResponsiveContainer"
import ModalDetalleLiquidacion from "@/components/liquidaciones/ModalDetalleLiquidacion"
import ModalSalidaKardex from "@/components/liquidaciones/ModalSalidaKardex"
import dayjs from "dayjs"

const { Dragger } = Upload

const LiquidacionesPage = () => {
  const [liquidaciones, setLiquidaciones] = useState<TLiquidacion[]>([])
  const [liquidacionActual, setLiquidacionActual] = useState<TLiquidacion | null>(null)
  const [liquidacionesActuales, setLiquidacionesActuales] = useState<TLiquidacion[]>([])
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detalleVisible, setDetalleVisible] = useState(false)
  const [editandoKardex, setEditandoKardex] = useState<{ [key: number]: boolean }>({})
  const [kardexEditado, setKardexEditado] = useState<{ [key: number]: string }>({})

  // Estados para edición de items
  const [editandoItem, setEditandoItem] = useState<{ [key: number]: boolean }>({})
  const [itemEditado, setItemEditado] = useState<{ [key: number]: TItemLiquidacion }>({})

  // Estados para edición de fecha del documento
  const [editandoFecha, setEditandoFecha] = useState<{ [key: number]: boolean }>({})
  const [fechaEditada, setFechaEditada] = useState<{ [key: number]: string }>({})

  // Estados para previsualización de PDF agregado
  const [modalPrevisualizacionVisible, setModalPrevisualizacionVisible] = useState(false)
  const [itemsPrevisualizacion, setItemsPrevisualizacion] = useState<TItemLiquidacion[]>([])
  const [nombreArchivoPrevisualizacion, setNombreArchivoPrevisualizacion] = useState("")
  const [vistaKardex, setVistaKardex] = useState(false)
  const [modalSalidaKardexVisible, setModalSalidaKardexVisible] = useState(false)
  const [fechaSalidaSeleccionada] = useState("")
  const [kardexSeleccionadoParaSalida, setKardexSeleccionadoParaSalida] = useState("")
  const [editandoKardexPreview, setEditandoKardexPreview] = useState<{ [key: number]: boolean }>({})
  const [kardexEditadoPreview, setKardexEditadoPreview] = useState<{ [key: number]: string }>({})

  // Estados para filtros
  const [filtroDocumento, setFiltroDocumento] = useState<string>("")
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("")

  // Helper para obtener la fecha del documento de los items
  const obtenerFechaDocumento = (liquidacion: TLiquidacion): string => {
    if (liquidacion.items && liquidacion.items.length > 0) {
      return liquidacion.items[0].fecha || "Sin fecha"
    }
    return "Sin fecha"
  }

  // Helper para calcular cantidad total de una liquidación
  const calcularCantidadTotal = (liquidacion: TLiquidacion): number => {
    return liquidacion.items.reduce((total, item) => total + Number(item.ingreso), 0)
  }

  // Helper para calcular costo promedio de una liquidación
  const calcularCostoPromedio = (liquidacion: TLiquidacion): number => {
    const totalCantidad = calcularCantidadTotal(liquidacion)
    const totalCosto = liquidacion.items.reduce((total, item) => 
      total + (Number(item.ingreso) * Number(item.costo_unitario)), 0
    )
    return totalCantidad > 0 ? totalCosto / totalCantidad : 0
  }

  // Helper para calcular totales de un grupo de liquidaciones
  /* const calcularTotalesGrupo = (liquidaciones: TLiquidacion[]) => {
    const totalCantidad = liquidaciones.reduce((sum, liq) => sum + calcularCantidadTotal(liq), 0)
    const totalCompra = liquidaciones.reduce((sum, liq) => sum + Number(liq.total_general), 0)
    
    // Calcular costo promedio ponderado del grupo
    const costoPromedioGrupo = totalCantidad > 0 ? totalCompra / totalCantidad : 0
    
    return {
      totalCantidad,
      totalCompra,
      costoPromedioGrupo
    }
  } */

  // Helper para generar movimientos tipo kardex
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

    // NO agrupar - cada item es un movimiento separado
    const itemsOrdenados = todosLosItems.sort((a, b) => {
      // Ordenar por fecha primero, luego por id para mantener consistencia
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

  // Helper para ordenar items
  const ordenarItems = (items: TItemLiquidacion[]): TItemLiquidacion[] => {
    return [...items].sort((a, b) => {
      // Primero ordenar por kardex
      if (a.kardex !== b.kardex) {
        return a.kardex.localeCompare(b.kardex)
      }
      
      // Dentro del mismo kardex, ordenar por fecha
      const fechaA = dayjs(a.fecha, 'DD/MM/YYYY')
      const fechaB = dayjs(b.fecha, 'DD/MM/YYYY')
      
      if (!fechaA.isSame(fechaB, 'day')) {
        return fechaA.diff(fechaB)
      }
      
      // En la misma fecha y kardex, ingresos primero, salidas después
      const tipoA = a.tipo || (Number(a.ingreso) > 0 ? 'ingreso' : 'salida')
      const tipoB = b.tipo || (Number(b.ingreso) > 0 ? 'ingreso' : 'salida')

      if (tipoA === "ingreso" && tipoB === "salida") return -1
      if (tipoA === "salida" && tipoB === "ingreso") return 1
      return 0
    })
  }

  // Helper para actualizar liquidacionActual con ordenamiento automático
  const actualizarLiquidacion = (updates: Partial<TLiquidacion>) => {
    if (!liquidacionActual) return

    const liquidacionActualizada = {
      ...liquidacionActual,
      ...updates
    }

    // Si se actualizan los items, ordenarlos automáticamente
    if (updates.items) {
      liquidacionActualizada.items = ordenarItems(updates.items)
    }

    setLiquidacionActual(liquidacionActualizada)
  }

  // Calcular saldos por kardex
  // COMENTADO: Ya no se usa después de ocultar el componente de resumen
  /*
  const calcularSaldosPorKardex = useMemo((): TSaldoKardex[] => {
    if (!liquidacionActual) return []

    const saldosPorKardex = new Map<string, TSaldoKardex>()

    liquidacionActual.items.forEach((item) => {
      if (!saldosPorKardex.has(item.kardex)) {
        saldosPorKardex.set(item.kardex, {
          kardex: item.kardex,
          descripcion: item.descripcion,
          total_ingreso: 0,
          total_salida: 0,
          saldo_pendiente: 0,
          costo_promedio: 0,
        })
      }

      const saldo = saldosPorKardex.get(item.kardex)!
      saldo.total_ingreso += Number(item.ingreso)
      saldo.total_salida += Number(item.salida)
    })

    // Calcular saldo pendiente y costo promedio
    saldosPorKardex.forEach((saldo) => {
      saldo.saldo_pendiente = saldo.total_ingreso - saldo.total_salida

      // Calcular costo promedio de los ingresos
      const itemsIngreso = liquidacionActual.items.filter(
        (item) => item.kardex === saldo.kardex && Number(item.ingreso) > 0
      )

      if (itemsIngreso.length > 0) {
        const totalCosto = itemsIngreso.reduce(
          (sum, item) => sum + Number(item.costo_unitario) * Number(item.ingreso),
          0
        )
        const totalCantidad = itemsIngreso.reduce((sum, item) => sum + Number(item.ingreso), 0)
        saldo.costo_promedio = totalCantidad > 0 ? totalCosto / totalCantidad : 0
      }
    })

    return Array.from(saldosPorKardex.values())
  }, [liquidacionActual])
  */

  // Cargar liquidaciones al montar el componente
  useEffect(() => {
    cargarLiquidaciones()
  }, [])

  // Cargar liquidaciones desde el backend
  const cargarLiquidaciones = async () => {
    setCargando(true)
    try {
      const response = await liquidacionService.getLiquidaciones()
      const data = response.data.content
      // Ordenar los items de cada liquidación
      const liquidacionesOrdenadas = data.map(liq => ({
        ...liq,
        items: ordenarItems(liq.items)
      }))
      setLiquidaciones(liquidacionesOrdenadas)
    } catch (error) {
      console.error("Error cargando liquidaciones:", error)
      toast.error("Error al cargar las liquidaciones")
    } finally {
      setCargando(false)
    }
  }

  // Configuración del Upload
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    maxCount: 20,
    accept: ".pdf",
    beforeUpload: async (file, fileList) => {
      const isPDF = file.type === "application/pdf"
      if (!isPDF) {
        message.error(`${file.name}: Solo puedes subir archivos PDF!`)
        return Upload.LIST_IGNORE
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error(`${file.name}: El archivo debe ser menor a 10MB!`)
        return Upload.LIST_IGNORE
      }

      // Validar que no se excedan 20 archivos
      if (fileList.length > 20) {
        message.warning("Solo puedes procesar hasta 20 archivos a la vez")
        return Upload.LIST_IGNORE
      }

      // Validar que el archivo no haya sido procesado anteriormente
      const archivoExistente = liquidaciones.find(l => l.nombre_archivo === file.name)
      if (archivoExistente) {
        message.error(`${file.name}: Este archivo ya fue procesado anteriormente. No se permite duplicar liquidaciones.`)
        toast.error(`${file.name}: Ya existe en el sistema`)
        return Upload.LIST_IGNORE
      }

      // Validar que no haya duplicados en el lote actual
      const duplicadoEnLoteActual = liquidacionesActuales.find(l => l.nombre_archivo === file.name)
      if (duplicadoEnLoteActual) {
        message.error(`${file.name}: Este archivo ya está siendo procesado en el lote actual.`)
        toast.error(`${file.name}: Archivo duplicado en el lote`)
        return Upload.LIST_IGNORE
      }

      // Al procesar el primer archivo, resetear la lista
      const esElPrimero = fileList[0] === file
      if (esElPrimero) {
        setLiquidacionesActuales([])
        setProcesando(true)
      }

      try {
        // Procesar el PDF
        const liquidacionProcesada = await procesarPDFCompleto(file)

        if (liquidacionProcesada.items.length === 0) {
          toast.error(`${file.name}: No se pudieron extraer items del PDF. Verifica el formato del documento.`)
          return Upload.LIST_IGNORE
        }

        // Marcar los items como ingresos
        liquidacionProcesada.items = liquidacionProcesada.items.map((item) => ({
          ...item,
          tipo: "ingreso" as const,
        }))

        // Agregar a la lista de liquidaciones procesadas
        setLiquidacionesActuales(prev => [...prev, liquidacionProcesada])

        toast.success(`${file.name}: PDF procesado con ${liquidacionProcesada.items.length} items encontrados`)

        // Si es el último archivo, abrir el modal de previsualización
        const esElUltimo = fileList[fileList.length - 1] === file
        if (esElUltimo) {
          setProcesando(false)
          setModalVisible(true)
        }
      } catch (error) {
        console.error("Error procesando PDF:", error)
        toast.error(`${file.name}: Error al procesar el PDF. Intenta con otro archivo.`)

        // Si es el último archivo, detener el procesamiento
        const esElUltimo = fileList[fileList.length - 1] === file
        if (esElUltimo) {
          setProcesando(false)
        }
      }

      return Upload.LIST_IGNORE
    },
  }

  // Configuración del Upload para agregar PDF a liquidación existente
  const uploadAgregarPDFProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".pdf",
    beforeUpload: async (file) => {
      if (!liquidacionActual) return Upload.LIST_IGNORE

      const isPDF = file.type === "application/pdf"
      if (!isPDF) {
        message.error("Solo puedes subir archivos PDF!")
        return Upload.LIST_IGNORE
      }

      // Validar que el archivo no haya sido procesado anteriormente
      const archivoExistente = liquidaciones.find(l => l.nombre_archivo === file.name)
      if (archivoExistente) {
        message.error(`${file.name}: Este archivo ya fue procesado anteriormente. No se permite duplicar liquidaciones.`)
        toast.error(`${file.name}: Ya existe en el sistema`)
        return Upload.LIST_IGNORE
      }

      // Validar que el archivo no esté ya incluido en la liquidación actual
      if (liquidacionActual.nombre_archivo.includes(file.name)) {
        message.error(`${file.name}: Este archivo ya está incluido en esta liquidación.`)
        toast.error(`${file.name}: Ya forma parte de esta liquidación`)
        return Upload.LIST_IGNORE
      }

      setProcesando(true)

      try {
        const liquidacionProcesada = await procesarPDFCompleto(file)

        if (liquidacionProcesada.items.length === 0) {
          toast.error("No se pudieron extraer items del PDF.")
          setProcesando(false)
          return Upload.LIST_IGNORE
        }

        // Validar que el número de documento coincida
        if (liquidacionProcesada.numero_documento !== liquidacionActual.numero_documento) {
          toast.error(
            `El documento PDF (${liquidacionProcesada.numero_documento}) no pertenece a esta liquidación (${liquidacionActual.numero_documento}). Por favor, verifica el archivo.`,
            {
              duration: 6000,
            }
          )
          setProcesando(false)
          return Upload.LIST_IGNORE
        }

        // Validar que no sea un archivo duplicado por número de documento
        const documentoExistente = liquidaciones.find(l => 
          l.numero_documento === liquidacionProcesada.numero_documento && l.id !== liquidacionActual.id
        )
        if (documentoExistente) {
          toast.error(
            `Ya existe una liquidación con el número de documento ${liquidacionProcesada.numero_documento}. No se pueden procesar documentos duplicados.`,
            {
              duration: 6000,
            }
          )
          setProcesando(false)
          return Upload.LIST_IGNORE
        }

        // Preparar items para previsualización
        const nuevosItems = liquidacionProcesada.items.map((item) => ({
          ...item,
          tipo: "ingreso" as const,
        }))

        // Mostrar modal de previsualización
        setItemsPrevisualizacion(nuevosItems)
        setNombreArchivoPrevisualizacion(file.name)
        setModalPrevisualizacionVisible(true)

        toast.success(`PDF procesado: ${nuevosItems.length} items encontrados`)
      } catch (error) {
        console.error("Error procesando PDF:", error)
        toast.error("Error al procesar el PDF.")
      } finally {
        setProcesando(false)
      }

      return Upload.LIST_IGNORE
    },
  }

  // Guardar liquidación procesada (múltiples liquidaciones)
  const handleGuardarLiquidacion = async () => {
    if (liquidacionesActuales.length === 0) return

    setGuardando(true)

    try {
      // Guardar todas las liquidaciones en la base de datos
      const liquidacionesGuardadas = []

      for (const liquidacion of liquidacionesActuales) {
        const response = await liquidacionService.storeLiquidacion(liquidacion)
        liquidacionesGuardadas.push(response.data.content)
      }

      // Actualizar la lista de liquidaciones
      setLiquidaciones([...liquidacionesGuardadas, ...liquidaciones])
      setModalVisible(false)

      // Limpiar estados
      setLiquidacionesActuales([])
      setEditandoKardex({})
      setKardexEditado({})
      setEditandoFecha({})
      setFechaEditada({})

      toast.success(`${liquidacionesGuardadas.length} liquidación(es) guardada(s) exitosamente en la base de datos`)
    } catch (error) {
      console.error("Error guardando liquidación:", error)
      toast.error("Error al guardar las liquidaciones. Intenta nuevamente.")
    } finally {
      setGuardando(false)
    }
  }

  // Confirmar y agregar items previsualizados
  const handleConfirmarAgregarItems = () => {
    if (!liquidacionActual) return

    const todosLosItems = [...liquidacionActual.items, ...itemsPrevisualizacion]
    const nuevoTotalGeneral = todosLosItems.reduce((sum, item) => sum + Number(item.total), 0)

    actualizarLiquidacion({
      items: todosLosItems,
      nombre_archivo: `${liquidacionActual.nombre_archivo}, ${nombreArchivoPrevisualizacion}`,
      total_items: liquidacionActual.total_items + itemsPrevisualizacion.length,
      total_general: nuevoTotalGeneral,
    })

    // Limpiar y cerrar modal
    setModalPrevisualizacionVisible(false)
    setItemsPrevisualizacion([])
    setNombreArchivoPrevisualizacion("")

    toast.success(`Se agregaron ${itemsPrevisualizacion.length} items nuevos`)
  }

  // Cancelar previsualización
  const handleCancelarPrevisualizacion = () => {
    setModalPrevisualizacionVisible(false)
    setItemsPrevisualizacion([])
    setNombreArchivoPrevisualizacion("")
    setEditandoKardexPreview({})
    setKardexEditadoPreview({})
  }

  // Editar kardex en previsualización
  const handleEditarKardexPreview = (index: number, kardexActual: string) => {
    setEditandoKardexPreview({ ...editandoKardexPreview, [index]: true })
    setKardexEditadoPreview({ ...kardexEditadoPreview, [index]: kardexActual })
  }

  // Guardar kardex editado en previsualización
  const handleGuardarKardexPreview = (index: number) => {
    const nuevoKardex = kardexEditadoPreview[index]
    if (!nuevoKardex || nuevoKardex.trim() === "") {
      toast.error("El número de kardex no puede estar vacío")
      return
    }

    const itemsActualizados = [...itemsPrevisualizacion]
    itemsActualizados[index] = {
      ...itemsActualizados[index],
      kardex: nuevoKardex.trim()
    }

    setItemsPrevisualizacion(itemsActualizados)
    setEditandoKardexPreview({ ...editandoKardexPreview, [index]: false })
    toast.success("Kardex actualizado")
  }

  // Cancelar edición de kardex en previsualización
  const handleCancelarEdicionPreview = (index: number) => {
    setEditandoKardexPreview({ ...editandoKardexPreview, [index]: false })
    setKardexEditadoPreview({ ...kardexEditadoPreview, [index]: "" })
  }

  // Habilitar edición de kardex
  const handleEditarKardex = (index: number, kardexActual: string) => {
    setEditandoKardex({ ...editandoKardex, [index]: true })
    setKardexEditado({ ...kardexEditado, [index]: kardexActual })
  }

  // Guardar kardex editado (funciona con múltiples liquidaciones)
  const handleGuardarKardex = (globalIndex: number) => {
    const nuevoKardex = kardexEditado[globalIndex]
    if (!nuevoKardex || nuevoKardex.trim() === "") {
      toast.error("El número de kardex no puede estar vacío")
      return
    }

    // Buscar en qué liquidación está el item
    let acumulado = 0
    let liquidacionIndex = -1
    let itemIndex = -1

    for (let i = 0; i < liquidacionesActuales.length; i++) {
      const itemsCount = liquidacionesActuales[i].items.length
      if (globalIndex < acumulado + itemsCount) {
        liquidacionIndex = i
        itemIndex = globalIndex - acumulado
        break
      }
      acumulado += itemsCount
    }

    if (liquidacionIndex === -1 || itemIndex === -1) return

    // Actualizar el item en la liquidación correspondiente
    const liquidacionesActualizadas = [...liquidacionesActuales]
    const itemsActualizados = [...liquidacionesActualizadas[liquidacionIndex].items]
    itemsActualizados[itemIndex] = {
      ...itemsActualizados[itemIndex],
      kardex: nuevoKardex.trim()
    }

    liquidacionesActualizadas[liquidacionIndex] = {
      ...liquidacionesActualizadas[liquidacionIndex],
      items: ordenarItems(itemsActualizados)
    }

    setLiquidacionesActuales(liquidacionesActualizadas)
    setEditandoKardex({ ...editandoKardex, [globalIndex]: false })
    toast.success("Kardex actualizado")
  }

  // Cancelar edición de kardex
  const handleCancelarEdicion = (index: number) => {
    setEditandoKardex({ ...editandoKardex, [index]: false })
    setKardexEditado({ ...kardexEditado, [index]: "" })
  }

  // Habilitar edición de item completo
  const handleEditarItem = (index: number, item: TItemLiquidacion) => {
    setEditandoItem({ ...editandoItem, [index]: true })
    setItemEditado({ ...itemEditado, [index]: { ...item } })
  }

  // Guardar item editado
  const handleGuardarItem = (index: number) => {
    if (!liquidacionActual) return

    const itemsActualizados = [...liquidacionActual.items]
    itemsActualizados[index] = itemEditado[index]

    // Recalcular el total general de la liquidación
    const nuevoTotalGeneral = itemsActualizados.reduce((sum, item) => sum + Number(item.total), 0)

    actualizarLiquidacion({ 
      items: itemsActualizados,
      total_general: nuevoTotalGeneral
    })
    setEditandoItem({ ...editandoItem, [index]: false })
    toast.success("Item actualizado")
  }

  // Cancelar edición de item
  const handleCancelarEdicionItem = (index: number) => {
    setEditandoItem({ ...editandoItem, [index]: false })
    delete itemEditado[index]
  }

  // Habilitar edición de fecha del documento (para todos los items de una liquidación)
  const handleEditarFecha = (liqIndex: number) => {
    const liquidacion = liquidacionesActuales[liqIndex]
    const fechaActual = liquidacion.items.length > 0 ? liquidacion.items[0].fecha : ""
    setEditandoFecha({ ...editandoFecha, [liqIndex]: true })
    setFechaEditada({ ...fechaEditada, [liqIndex]: fechaActual })
  }

  // Guardar fecha editada (aplicar a todos los items de la liquidación)
  const handleGuardarFecha = (liqIndex: number) => {
    const nuevaFecha = fechaEditada[liqIndex]
    if (!nuevaFecha || nuevaFecha.trim() === "") {
      toast.error("La fecha no puede estar vacía")
      return
    }

    // Validar formato de fecha DD/MM/YYYY
    const formatoFecha = /^\d{2}\/\d{2}\/\d{4}$/
    if (!formatoFecha.test(nuevaFecha)) {
      toast.error("La fecha debe tener el formato DD/MM/YYYY")
      return
    }

    // Actualizar la fecha en todos los items de la liquidación
    const liquidacionesActualizadas = [...liquidacionesActuales]
    liquidacionesActualizadas[liqIndex] = {
      ...liquidacionesActualizadas[liqIndex],
      items: liquidacionesActualizadas[liqIndex].items.map(item => ({
        ...item,
        fecha: nuevaFecha.trim()
      }))
    }

    setLiquidacionesActuales(liquidacionesActualizadas)
    setEditandoFecha({ ...editandoFecha, [liqIndex]: false })
    toast.success("Fecha actualizada en todos los items de la liquidación")
  }

  // Cancelar edición de fecha
  const handleCancelarEdicionFecha = (liqIndex: number) => {
    setEditandoFecha({ ...editandoFecha, [liqIndex]: false })
    setFechaEditada({ ...fechaEditada, [liqIndex]: "" })
  }

  // Actualizar fecha de todos los items de una liquidación (para modal de detalle)
  const handleActualizarFechaItems = (nuevaFecha: string) => {
    if (!liquidacionActual) return

    const itemsActualizados = liquidacionActual.items.map(item => ({
      ...item,
      fecha: nuevaFecha
    }))

    actualizarLiquidacion({ items: itemsActualizados })
  }

  // Actualizar liquidación existente
  const handleActualizarLiquidacion = async () => {
    if (!liquidacionActual || !liquidacionActual.id) return

    setGuardando(true)

    try {
      // Usar el método de actualización en lugar de crear nueva
      const response = await liquidacionService.updateLiquidacion(
        liquidacionActual.id,
        liquidacionActual
      )
      const liquidacionActualizada = response.data.content

      // Ordenar los items de la liquidación actualizada antes de actualizar el estado
      const liquidacionOrdenada = {
        ...liquidacionActualizada,
        items: ordenarItems(liquidacionActualizada.items)
      }

      setLiquidaciones(
        liquidaciones.map((l) => (l.id === liquidacionOrdenada.id ? liquidacionOrdenada : l))
      )
      setDetalleVisible(false)
      toast.success("Liquidación actualizada exitosamente")
    } catch (error) {
      console.error("Error actualizando liquidación:", error)
      toast.error("Error al actualizar la liquidación.")
    } finally {
      setGuardando(false)
    }
  }

  // Ver detalle de liquidación
  const handleVerDetalle = (liquidacion: TLiquidacion) => {
    setLiquidacionActual({
      ...liquidacion,
      items: ordenarItems(liquidacion.items)
    })
    setDetalleVisible(true)
  }

  // Eliminar liquidación
  const handleEliminar = (id: number) => {
    Modal.confirm({
      title: "¿Estás seguro de eliminar esta liquidación?",
      content: "Esta acción no se puede deshacer",
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await liquidacionService.deleteLiquidacion(id)
          setLiquidaciones(liquidaciones.filter((l) => l.id !== id))
          toast.success("Liquidación eliminada")
        } catch (error) {
          console.error("Error eliminando liquidación:", error)
          toast.error("Error al eliminar la liquidación")
        }
      },
    })
  }

  // Función para manejar registro de salida desde kardex
  const handleRegistrarSalidaKardex = async (datosSalida: any) => {
    try {
      // Extraer información del cliente
      const nombreCliente = datosSalida.cliente?.nombre_mostrar || datosSalida.cliente?.nombres || 'Cliente directo'
      const documentoCliente = datosSalida.cliente?.documento_completo || datosSalida.cliente?.documento_numero || ''
      
      // La fecha ya viene formateada correctamente desde el modal (DD/MM/YYYY)
      const fechaFormateada = datosSalida.fecha

      // Buscar la liquidación que contenga este kardex EN LA EMPRESA ESPECÍFICA para obtener el número de documento de empresa matriz
      let liquidacionReferencia = liquidaciones.find(liq => 
        liq.numero_documento === kardexSeleccionadoParaSalida &&
        liq.items.some(item => item.kardex === datosSalida.kardex)
      )

      if (!liquidacionReferencia) {
        toast.error(`No se encontró ningún ingreso para el kardex ${datosSalida.kardex} en la empresa ${kardexSeleccionadoParaSalida}. Debe haber ingresos antes de registrar salidas.`)
        return
      }

      // Usar el número de documento de empresa matriz correcto (ya verificado arriba)
      const numeroDocumentoEmpresa = kardexSeleccionadoParaSalida

      // Buscar primero si existe un item con la misma fecha en cualquier liquidación de salidas de esta empresa
      let liquidacionSalidas = null
      const liquidacionesSalidasEmpresa = liquidaciones.filter(liq => 
        liq.numero_documento === numeroDocumentoEmpresa && 
        liq.nombre_archivo.includes('SALIDAS') // Identificar liquidaciones de salidas
      )

      // Buscar en todas las liquidaciones de salidas de la empresa si hay un item con la misma fecha
      for (const liquidacion of liquidacionesSalidasEmpresa) {
        const itemConMismaFecha = liquidacion.items.find(item => item.fecha === fechaFormateada)
        if (itemConMismaFecha) {
          liquidacionSalidas = liquidacion // Usar la liquidación padre que contiene el item con la misma fecha
          break
        }
      }

      // Preparar el item de salida antes de crear/actualizar la liquidación
      let numeroDocumentoLimpio = ''
      if (documentoCliente) {
        const match = documentoCliente.match(/(?:RUC|DNI|CARNET_EXTRANJERIA|PASAPORTE):\s*(.+)/i)
        if (match) {
          numeroDocumentoLimpio = match[1].trim()
        } else {
          numeroDocumentoLimpio = documentoCliente
        }
      }

      // Buscar la descripción correcta del kardex en todas las liquidaciones de la empresa
      let descripcionProducto = `${datosSalida.kardex} - Producto`
      const liquidacionesEmpresa = liquidaciones.filter(liq => liq.numero_documento === numeroDocumentoEmpresa)
      
      for (const liq of liquidacionesEmpresa) {
        const itemConDescripcion = liq.items.find(item => 
          item.kardex === datosSalida.kardex && item.descripcion && item.descripcion.trim() !== ''
        )
        if (itemConDescripcion) {
          descripcionProducto = itemConDescripcion.descripcion
          break
        }
      }

      const nuevoItemSalida: TItemLiquidacion = {
        kardex: datosSalida.kardex,
        descripcion: descripcionProducto,
        fecha: fechaFormateada,
        proveedor: nombreCliente,
        ruc_dni: numeroDocumentoLimpio,
        ingreso: 0,
        salida: datosSalida.cantidad,
        costo_unitario: datosSalida.precioUnitario, // Usar el precio unitario del modal
        total: datosSalida.total, // Usar el total calculado del modal
        tipo: 'salida'
      }

      if (!liquidacionSalidas) {
        // Crear nueva liquidación CON el primer item incluido
        const nuevaLiquidacionSalidas = {
          numero_documento: numeroDocumentoEmpresa,
          fecha_procesamiento: new Date(),
          nombre_archivo: `SALIDAS-${numeroDocumentoEmpresa}-${Date.now()}.virtual`,
          total_items: 1,
          total_general: 0,
          estado: 'procesado' as const,
          items: [nuevoItemSalida]
        }

        const response = await liquidacionService.storeLiquidacion(nuevaLiquidacionSalidas)
        liquidacionSalidas = response.data.content
        setLiquidaciones(prev => [...prev, liquidacionSalidas!])
        toast.success(`Salida registrada: ${datosSalida.cantidad}kg a ${nombreCliente} por S/ ${datosSalida.total}`)
      } else {
        // Ya existe liquidación de salidas, agregar el nuevo item preservando los existentes
        const nuevoItemSinId = { ...nuevoItemSalida }
        delete nuevoItemSinId.id // Asegurar que no tenga ID para que sea creado como nuevo
        
        // Crear una copia explícita de todos los items existentes SIN sus IDs para que se recreen
        const itemsExistentesSinId = liquidacionSalidas.items.map(item => ({
          kardex: item.kardex,
          descripcion: item.descripcion,
          fecha: item.fecha,
          proveedor: item.proveedor,
          ruc_dni: item.ruc_dni,
          ingreso: item.ingreso,
          salida: item.salida,
          costo_unitario: item.costo_unitario,
          total: item.total,
          tipo: item.tipo
        }))
        
        // Agregar el nuevo item a la lista
        const todosLosItems = [...itemsExistentesSinId, nuevoItemSinId]
        
        // Preparar la liquidación actualizada con todos los items
        const liquidacionActualizada = {
          ...liquidacionSalidas,
          total_items: todosLosItems.length,
          total_general: todosLosItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
          items: todosLosItems
        }
        
        // Actualizar la liquidación enviando todos los items (existentes + nuevo)
        const response = await liquidacionService.updateLiquidacion(liquidacionSalidas.id!, liquidacionActualizada)
        const liquidacionActualizadaCompleta = response.data.content
        
        // Actualizar el estado local con la respuesta del backend
        liquidacionSalidas.items = ordenarItems(liquidacionActualizadaCompleta.items)
        liquidacionSalidas.total_items = liquidacionActualizadaCompleta.total_items
        liquidacionSalidas.total_general = liquidacionActualizadaCompleta.total_general
        
        setLiquidaciones(prev => 
          prev.map(liq => 
            liq.id === liquidacionSalidas!.id ? liquidacionSalidas! : liq
          )
        )
        toast.success(`Salida registrada: ${datosSalida.cantidad}kg a ${nombreCliente} por S/ ${datosSalida.total}`)
      }

      // Cerrar modal
      setModalSalidaKardexVisible(false)

      // Recargar las liquidaciones desde el servidor para obtener los datos más actualizados
      try {
        const response = await liquidacionService.getLiquidaciones()
        const liquidacionesActualizadas = response.data.content || []
        setLiquidaciones(liquidacionesActualizadas)
      } catch (error) {
        console.error('Error recargando liquidaciones:', error)
      }

    } catch (error) {
      console.error('Error registrando salida:', error)
      toast.error('Error al registrar la salida')
      throw error // Re-lanzar el error para que el modal no se cierre
    }
  }

  // Obtener documentos únicos para el filtro
  const documentosUnicos = useMemo(() => {
    return Array.from(new Set(liquidaciones.map(l => l.numero_documento))).sort()
  }, [liquidaciones])

  // Obtener empresas únicas para el filtro (basado en número de documento)
  const empresasUnicas = useMemo(() => {
    return Array.from(new Set(liquidaciones.map(l => l.numero_documento))).sort()
  }, [liquidaciones])

  // Filtrar liquidaciones
  const liquidacionesFiltradas = useMemo(() => {
    let filtradas = [...liquidaciones]

    if (filtroDocumento) {
      filtradas = filtradas.filter(l => l.numero_documento === filtroDocumento)
    }

    if (filtroEmpresa) {
      filtradas = filtradas.filter(l => l.numero_documento === filtroEmpresa)
    }

    return filtradas
  }, [liquidaciones, filtroDocumento, filtroEmpresa])

  // Agrupar liquidaciones por número de documento de empresa (RUC)
  const liquidacionesAgrupadasPorEmpresa = useMemo(() => {
    const grupos: { [key: string]: TLiquidacion[] } = {}

    liquidacionesFiltradas.forEach(liquidacion => {
      let numeroDocumento = liquidacion.numero_documento
      
      // Si es una liquidación de salidas (archivo virtual), extraer el RUC del nombre del archivo
      if (liquidacion.nombre_archivo.includes('.virtual')) {
        // El formato del archivo es: SALIDAS-[RUC]-[timestamp].virtual
        // Extraer el RUC del nombre del archivo
        const match = liquidacion.nombre_archivo.match(/SALIDAS-(\d+)-/)
        if (match && match[1]) {
          numeroDocumento = match[1]
        }
        // Si no se puede extraer del nombre, usar el numero_documento original
        // (esto mantiene compatibilidad con archivos que no sigan el formato esperado)
      }
      
      if (!grupos[numeroDocumento]) {
        grupos[numeroDocumento] = []
      }
      grupos[numeroDocumento].push(liquidacion)
    })

    // Convertir a array y ordenar por número de documento
    return Object.entries(grupos)
      .map(([numeroDoc, items]) => {
        return {
          numeroDocumento: numeroDoc,
          nombreEmpresa: `Empresa RUC: ${numeroDoc}`,
          liquidaciones: items.sort((a, b) => {
            const fechaA = obtenerFechaDocumento(a)
            const fechaB = obtenerFechaDocumento(b)
            // Ordenar por fecha del documento, más antigua primero (ascendente)
            return fechaA.localeCompare(fechaB)
          })
        }
      })
      .sort((a, b) => a.numeroDocumento.localeCompare(b.numeroDocumento))
  }, [liquidacionesFiltradas])

  // Columnas de la tabla de liquidaciones (versión compacta)
  const columnasLiquidaciones: TableColumnsType<TLiquidacion> = [
    {
      title: "Archivo",
      dataIndex: "nombre_archivo",
      key: "nombre_archivo",
      width: "25%",
      minWidth: 200,
      render: (text) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <Tooltip title={text}>
            <span className="text-xs font-medium truncate">
              {text?.length > 30 ? `${text.substring(0, 30)}...` : text}
            </span>
          </Tooltip>
        </div>
      ),
      ellipsis: true,
    },
    {
      title: "Fecha Doc.",
      key: "fecha_documento",
      width: "12%",
      minWidth: 90,
      align: "center",
      render: (_, record) => (
        <span className="text-xs font-medium text-gray-700">
          {obtenerFechaDocumento(record)}
        </span>
      ),
      sorter: (a, b) => obtenerFechaDocumento(a).localeCompare(obtenerFechaDocumento(b)),
    },
    {
      title: "Cantidad (kg)",
      key: "cantidad_total",
      width: "15%",
      minWidth: 100,
      align: "right",
      render: (_, record) => (
        <span className="text-xs font-bold text-green-700">
          {calcularCantidadTotal(record).toFixed(0)}
        </span>
      ),
      sorter: (a, b) => calcularCantidadTotal(a) - calcularCantidadTotal(b),
    },
    {
      title: "Costo Promedio",
      key: "costo_promedio",
      width: "15%",
      minWidth: 110,
      align: "right",
      render: (_, record) => (
        <span className="text-xs">S/ {calcularCostoPromedio(record).toFixed(4)}</span>
      ),
      sorter: (a, b) => calcularCostoPromedio(a) - calcularCostoPromedio(b),
    },
    {
      title: "Total Compra",
      dataIndex: "total_general",
      key: "total_general",
      width: "18%",
      minWidth: 120,
      render: (total) => (
        <span className="text-xs font-bold text-green-700">
          S/ {Number(total).toFixed(0)}
        </span>
      ),
      align: "right",
    },
    {
      title: "Acciones",
      key: "acciones",
      width: "15%",
      minWidth: 100,
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
            size="small"
            className="text-blue-500 hover:text-blue-700"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminar(record.id!)}
            size="small"
            className="text-red-500 hover:text-red-700"
          />
        </div>
      ),
    },
  ]

  // Columnas para la tabla tipo kardex
  const columnasKardex = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: "12%",
      render: (fecha: string) => <span className="text-xs font-medium">{fecha}</span>,
    },
    {
      title: "INGRESO",
      children: [
        {
          title: "CANT",
          dataIndex: "cantidadIngreso",
          key: "cantidadIngreso",
          width: "9%",
          align: "right" as const,
          render: (val: number) => (val && val > 0) ? <span className="text-xs text-blue-600">{val.toFixed(2)}</span> : "",
        },
        {
          title: "P.UNIT",
          dataIndex: "costoIngreso",
          key: "costoIngreso",
          width: "10%",
          align: "right" as const,
          render: (val: number) => (val && val > 0) ? <span className="text-xs">{val.toFixed(2)}</span> : "",
        },
        {
          title: "TOTAL",
          dataIndex: "totalIngreso",
          key: "totalIngreso",
          width: "11%",
          align: "right" as const,
          render: (val: number) => (val && val > 0) ? <span className="text-xs text-green-600">{val.toFixed(2)}</span> : "",
        },
      ],
    },
    {
      title: "SALIDA",
      children: [
        {
          title: "CANT",
          dataIndex: "cantidadSalida",
          key: "cantidadSalida",
          width: "9%",
          align: "right" as const,
          render: (val: number) => val > 0 ? <span className="text-xs text-red-600">{val.toFixed(2)}</span> : "",
        },
        {
          title: "P.UNIT",
          dataIndex: "costoSalida",
          key: "costoSalida",
          width: "10%",
          align: "right" as const,
          render: (val: number) => val > 0 ? <span className="text-xs">{val.toFixed(4)}</span> : "",
        },
        {
          title: "TOTAL",
          dataIndex: "totalSalida",
          key: "totalSalida",
          width: "11%",
          align: "right" as const,
          render: (val: number) => val > 0 ? <span className="text-xs text-red-600">{val.toFixed(2)}</span> : "",
        },
      ],
    },
    {
      title: "STOCK",
      children: [
        {
          title: "CANT",
          dataIndex: "stockActual",
          key: "stockActual",
          width: "9%",
          align: "right" as const,
          render: (val: number) => <span className="text-xs font-bold text-purple-600">{val.toFixed(2)}</span>,
        },
        {
          title: "P.UNIT",
          dataIndex: "costoPromedio",
          key: "costoPromedio",
          width: "10%",
          align: "right" as const,
          render: (val: number) => <span className="text-xs">{val.toFixed(4)}</span>,
        },
        {
          title: "TOTAL",
          dataIndex: "valorStock",
          key: "valorStock",
          width: "15%",
          align: "right" as const,
          render: (val: number) => <span className="text-xs font-bold text-purple-600">{val.toFixed(2)}</span>,
        },
      ],
    },
  ]

  // Columnas de la tabla de items
  const columnasItems: TableColumnsType<TItemLiquidacion> = [
    {
      title: "Kardex",
      dataIndex: "kardex",
      key: "kardex",
      width: 80,
      align: "center",
      render: (text) => <strong className="text-blue-600">{text}</strong>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 100,
    },
    {
      title: "Proveedor",
      dataIndex: "proveedor",
      key: "proveedor",
      width: 200,
      ellipsis: true,
    },
    {
      title: "RUC/DNI",
      dataIndex: "ruc_dni",
      key: "ruc_dni",
      width: 120,
    },
    {
      title: "Ingreso",
      dataIndex: "ingreso",
      key: "ingreso",
      align: "right",
      width: 100,
    },
    {
      title: "Salida",
      dataIndex: "salida",
      key: "salida",
      align: "right",
      width: 100,
    },
    {
      title: "Costo Unit.",
      dataIndex: "costo_unitario",
      key: "costo_unitario",
      align: "right",
      width: 100,
      render: (value) => `S/ ${Number(value).toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 120,
      render: (value) => <strong>S/ {Number(value).toFixed(2)}</strong>,
    },
  ]

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
            <p className="text-gray-500">Gestión de liquidaciones desde archivos PDF</p>
          </div>
        </div>

        {/* Área de carga */}
        <Card>
          <Spin spinning={procesando} tip="Procesando PDF...">
            <Dragger {...uploadProps} className="p-4">
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text text-lg font-semibold">
                Haz clic o arrastra un archivo PDF aquí
              </p>
              <p className="ant-upload-hint">
                El sistema procesará automáticamente el PDF y extraerá los datos de la liquidación.
                <br />
                Soporta archivos PDF de hasta 10MB.
                <br />
                <strong>Nota:</strong> No se permite subir archivos que ya fueron procesados anteriormente.
              </p>
            </Dragger>
          </Spin>

          {procesando && (
            <div className="mt-4 text-center text-gray-600">
              <p>Extrayendo datos del PDF...</p>
              <p className="text-sm">Este proceso puede tomar unos segundos</p>
            </div>
          )}
        </Card>

        {/* Tabla de liquidaciones */}
        {liquidaciones.length > 0 && (
          <Card
            title={`Liquidaciones Procesadas (${liquidacionesFiltradas.length}${filtroDocumento || filtroEmpresa ? ` de ${liquidaciones.length}` : ''})`}
            extra={
              <div className="flex gap-3">
                <Select
                  placeholder="Filtrar por documento"
                  style={{ width: 200 }}
                  allowClear
                  value={filtroDocumento || undefined}
                  onChange={(value) => setFiltroDocumento(value || "")}
                  options={documentosUnicos.map(doc => ({ label: doc, value: doc }))}
                />
                <Select
                  placeholder="Filtrar por empresa"
                  style={{ width: 200 }}
                  allowClear
                  value={filtroEmpresa || undefined}
                  onChange={(value) => setFiltroEmpresa(value || "")}
                  options={empresasUnicas.map(empresa => ({ 
                    label: `RUC: ${empresa}`, 
                    value: empresa 
                  }))}
                />
              </div>
            }
          >
            {liquidacionesAgrupadasPorEmpresa.map((grupo) => {
              /* const totalesGrupo = calcularTotalesGrupo(grupo.liquidaciones) */
              
              // Calcular totales reales del kardex (stock actual)
              const movimientosKardex = generarMovimientosKardex(grupo.liquidaciones)
              const ultimoMovimiento = movimientosKardex[movimientosKardex.length - 1]
              const stockRealTotal = ultimoMovimiento ? ultimoMovimiento.stockActual : 0
              const valorStockReal = ultimoMovimiento ? ultimoMovimiento.valorStock : 0
              
              return (
                <div key={grupo.numeroDocumento} className="mb-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg mb-2 border border-green-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold text-green-800">
                        RUC: {grupo.numeroDocumento}
                      </h3>
                      <div className="flex gap-4 items-center">
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>{grupo.liquidaciones.length} liquidaciones</span>
                          <span>{stockRealTotal.toFixed(2)} kg total</span>
                          <span className="font-semibold text-green-700">
                            S/ {valorStockReal.toFixed(2)} total
                          </span>
                        </div>
                        <Button
                          size="small"
                          onClick={() => setVistaKardex(!vistaKardex)}
                          icon={vistaKardex ? <TableOutlined /> : <StockOutlined />}
                        >
                          {vistaKardex ? 'Vista Normal' : 'Vista Kardex'}
                        </Button>
                        {vistaKardex && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setKardexSeleccionadoParaSalida(grupo.numeroDocumento)
                              setModalSalidaKardexVisible(true)
                            }}
                            className="bg-red-500 hover:bg-red-600 border-red-500"
                          >
                            Registrar Salida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {vistaKardex ? (
                    // Vista Kardex
                    <Table
                      columns={columnasKardex}
                      dataSource={generarMovimientosKardex(grupo.liquidaciones)}
                      rowKey="key"
                      pagination={false}
                      size="small"
                      className="kardex-table"
                      style={{
                        fontSize: '10px'
                      }}
                      components={{
                        body: {
                          row: (props: any) => (
                            <tr {...props} style={{ height: '24px' }} />
                          ),
                        },
                      }}
                      summary={(pageData) => {
                        const lastItem = pageData[pageData.length - 1]
                        if (lastItem) {
                          return (
                            <Table.Summary.Row className="font-bold bg-blue-50">
                              <Table.Summary.Cell index={0}></Table.Summary.Cell>
                              <Table.Summary.Cell index={1}></Table.Summary.Cell>
                              <Table.Summary.Cell index={2}></Table.Summary.Cell>
                              <Table.Summary.Cell index={3}></Table.Summary.Cell>
                              <Table.Summary.Cell index={4}></Table.Summary.Cell>
                              <Table.Summary.Cell index={5}></Table.Summary.Cell>
                              <Table.Summary.Cell index={6}></Table.Summary.Cell>
                              <Table.Summary.Cell index={7} align="right">
                                <span className="text-purple-600 font-bold">{lastItem.stockActual.toFixed(2)}</span>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={8} align="right">
                                <span className="text-purple-600">{lastItem.costoPromedio?.toFixed(4)}</span>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={9} align="right">
                                <span className="text-purple-600 font-bold">{lastItem.valorStock?.toFixed(2)}</span>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          )
                        }
                        return null
                      }}
                    />
                  ) : (
                    // Vista Normal
                    <Table
                      columns={columnasLiquidaciones}
                      dataSource={grupo.liquidaciones}
                      rowKey="id"
                      pagination={{
                        pageSize: 50,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                          `${range[0]}-${range[1]} de ${total} liquidaciones`,
                        pageSizeOptions: ['25', '50', '100', '200'],
                        size: 'small'
                      }}
                      scroll={{ y: 400 }}
                      loading={cargando}
                      size="small"
                      className="compact-table"
                      style={{
                        fontSize: '11px'
                      }}
                      components={{
                        body: {
                          row: (props: any) => (
                            <tr {...props} style={{ height: '32px' }} />
                          ),
                        },
                      }}

                    />
                  )}
                </div>
              )
            })}
          </Card>
        )}

        {liquidaciones.length === 0 && !cargando && (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No hay liquidaciones registradas</p>
              <p className="text-sm">Sube un archivo PDF para comenzar</p>
            </div>
          </Card>
        )}

        {/* Modal de vista previa */}
        <Modal
          title={`Vista Previa de Liquidaciones (${liquidacionesActuales.length})`}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setLiquidacionesActuales([])
            setEditandoFecha({})
            setFechaEditada({})
          }}
          width={1300}
          centered
          style={{ top: 20, maxWidth: 1300 }}
          styles={{
            body: {
              maxHeight: 'calc(100vh - 180px)',
              overflowY: 'auto',
            }
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setModalVisible(false)
              setLiquidacionesActuales([])
              setEditandoFecha({})
              setFechaEditada({})
            }}>
              Cancelar
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleGuardarLiquidacion}
              loading={guardando}
            >
              Guardar {liquidacionesActuales.length} Liquidación{liquidacionesActuales.length !== 1 ? 'es' : ''}
            </Button>,
          ]}
        >
          {liquidacionesActuales.length > 0 && (
            <div className="space-y-6">
              {/* Resumen general */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div>
                  <span className="text-gray-600 text-sm">Total Liquidaciones:</span>
                  <p className="font-bold text-xl text-blue-700">{liquidacionesActuales.length}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Total Items:</span>
                  <p className="font-bold text-xl text-blue-700">
                    {liquidacionesActuales.reduce((sum, liq) => sum + liq.total_items, 0)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Total General:</span>
                  <p className="font-bold text-xl text-green-600">
                    S/ {liquidacionesActuales.reduce((sum, liq) => sum + Number(liq.total_general), 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Documentos:</span>
                  <p className="font-semibold text-sm truncate">
                    {Array.from(new Set(liquidacionesActuales.map(l => l.numero_documento))).join(', ')}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                <strong>Nota:</strong> Puedes editar el número de kardex haciendo clic en el ícono de edición y 
                la <strong>fecha del documento</strong> haciendo clic en "Editar" junto a la fecha. 
                La fecha se aplicará a todos los items de esa liquidación. Se guardarán todas las liquidaciones al confirmar.
              </div>

              {/* Lista de liquidaciones */}
              {liquidacionesActuales.map((liquidacion, liqIndex) => (
                <div key={liqIndex} className="border-2 border-blue-300 rounded-lg overflow-hidden shadow-md">
                  {/* Cabecera de la liquidación */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">
                          Liquidación #{liqIndex + 1}: {liquidacion.numero_documento}
                        </h3>
                        <p className="text-sm text-blue-100 mt-1">{liquidacion.nombre_archivo}</p>
                        
                        {/* Fecha del documento editable */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-blue-100">Fecha del documento:</span>
                          {editandoFecha[liqIndex] ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={fechaEditada[liqIndex] || ""}
                                onChange={(e) => setFechaEditada({ ...fechaEditada, [liqIndex]: e.target.value })}
                                placeholder="DD/MM/YYYY"
                                style={{ width: 120 }}
                                size="small"
                                autoFocus
                                onPressEnter={() => handleGuardarFecha(liqIndex)}
                              />
                              <Button
                                type="primary"
                                size="small"
                                icon={<SaveOutlined />}
                                onClick={() => handleGuardarFecha(liqIndex)}
                              />
                              <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => handleCancelarEdicionFecha(liqIndex)}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {liquidacion.items.length > 0 ? liquidacion.items[0].fecha : "Sin fecha"}
                              </span>
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditarFecha(liqIndex)}
                                className="text-blue-100 hover:text-white"
                              >
                                Editar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">Total Items</div>
                        <div className="text-2xl font-bold">{liquidacion.total_items}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">Total</div>
                        <div className="text-2xl font-bold">S/ {Number(liquidacion.total_general).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Items de la liquidación */}
                  <div className="p-4 bg-white space-y-3">
                    {liquidacion.items.map((item, itemIndex) => {
                      const globalIndex = liquidacionesActuales
                        .slice(0, liqIndex)
                        .reduce((sum, liq) => sum + liq.items.length, 0) + itemIndex

                      return (
                        <div key={itemIndex} className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 font-semibold text-sm border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600">KARDEX</span>
                              {editandoKardex[globalIndex] ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={kardexEditado[globalIndex] || item.kardex}
                                    onChange={(e) => setKardexEditado({ ...kardexEditado, [globalIndex]: e.target.value })}
                                    style={{ width: 100 }}
                                    autoFocus
                                    onPressEnter={() => handleGuardarKardex(globalIndex)}
                                  />
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<SaveOutlined />}
                                    onClick={() => handleGuardarKardex(globalIndex)}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    size="small"
                                    icon={<CloseOutlined />}
                                    onClick={() => handleCancelarEdicion(globalIndex)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 font-bold text-base">{item.kardex}</span>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditarKardex(globalIndex, item.kardex)}
                                  >
                                    Editar
                                  </Button>
                                </div>
                              )}
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-700">{item.descripcion}</span>
                            </div>
                          </div>
                          <Table
                            columns={columnasItems}
                            dataSource={[item]}
                            rowKey={(record) => `${liqIndex}-${itemIndex}-${record.kardex}`}
                            pagination={false}
                            size="small"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Modal de detalle con edición */}
        <ModalDetalleLiquidacion
          visible={detalleVisible}
          liquidacion={liquidacionActual}
          onClose={() => setDetalleVisible(false)}
          onGuardar={handleActualizarLiquidacion}
          onEditarItem={handleEditarItem}
          onGuardarItem={handleGuardarItem}
          onCancelarEdicionItem={handleCancelarEdicionItem}
          editandoItem={editandoItem}
          itemEditado={itemEditado}
          setItemEditado={setItemEditado}
          guardando={guardando}
          uploadAgregarPDFProps={uploadAgregarPDFProps}
          procesando={procesando}
          onActualizarFechaItems={handleActualizarFechaItems}
        />

        {/* Modal de previsualización de PDF agregado */}
        <Modal
          title={`Previsualización - ${nombreArchivoPrevisualizacion}`}
          open={modalPrevisualizacionVisible}
          onCancel={handleCancelarPrevisualizacion}
          width={1100}
          centered
          styles={{
            body: {
              maxHeight: 'calc(100vh - 250px)',
              overflowY: 'auto',
              padding: '16px',
            }
          }}
          footer={[
            <Button key="cancel" onClick={handleCancelarPrevisualizacion}>
              Cancelar
            </Button>,
            <Button
              key="add"
              type="primary"
              onClick={handleConfirmarAgregarItems}
              icon={<PlusOutlined />}
            >
              Agregar {itemsPrevisualizacion.length} Items
            </Button>,
          ]}
        >
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded border border-blue-200 sticky top-0 z-10">
              <p className="text-sm text-blue-800">
                <InfoCircleOutlined className="mr-2" />
                Se encontraron <strong>{itemsPrevisualizacion.length} items</strong> en el PDF.
                Revisa que la información sea correcta antes de agregarlos. Puedes editar los números de kardex si es necesario.
              </p>
            </div>

            <div className="space-y-3">
              {itemsPrevisualizacion.map((item, index) => (
                <div key={index} className="border rounded shadow-sm bg-white">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-b flex flex-wrap items-center gap-2">
                    <span className="text-gray-600 text-xs font-medium">KARDEX</span>
                    {editandoKardexPreview[index] ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Input
                          value={kardexEditadoPreview[index] || item.kardex}
                          onChange={(e) => setKardexEditadoPreview({ ...kardexEditadoPreview, [index]: e.target.value })}
                          style={{ width: 80 }}
                          size="small"
                          autoFocus
                          onPressEnter={() => handleGuardarKardexPreview(index)}
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<SaveOutlined />}
                          onClick={() => handleGuardarKardexPreview(index)}
                        />
                        <Button
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => handleCancelarEdicionPreview(index)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-bold text-sm">{item.kardex}</span>
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditarKardexPreview(index, item.kardex)}
                          className="h-6 px-1"
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-700 text-sm truncate flex-1 min-w-0">{item.descripcion}</span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-gray-500 block mb-1">Fecha:</span>
                        <p className="font-medium truncate">{item.fecha}</p>
                      </div>
                      <div className="min-w-0 md:col-span-2">
                        <span className="text-gray-500 block mb-1">Proveedor:</span>
                        <p className="font-medium truncate" title={item.proveedor}>{item.proveedor}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500 block mb-1">RUC/DNI:</span>
                        <p className="font-medium truncate">{item.ruc_dni}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500 block mb-1">Ingreso:</span>
                        <p className="font-bold text-green-600">{item.ingreso}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-gray-500 block mb-1">Costo Unit.:</span>
                        <p className="font-medium">S/ {Number(item.costo_unitario).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-end">
                      <div className="text-right">
                        <span className="text-gray-500 text-xs">Total:</span>
                        <p className="font-bold text-blue-600 text-base">S/ {Number(item.total).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded border border-green-200 flex justify-between items-center sticky bottom-0 z-10 shadow-lg">
              <span className="font-semibold text-gray-700">Total General:</span>
              <span className="text-2xl font-bold text-green-600">
                S/ {itemsPrevisualizacion.reduce((sum, item) => sum + Number(item.total), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>

        {/* Modal para registrar salida desde vista kardex */}
        <ModalSalidaKardex
          visible={modalSalidaKardexVisible}
          onClose={() => setModalSalidaKardexVisible(false)}
          onRegistrarSalida={handleRegistrarSalidaKardex}
          numeroDocumentoEmpresa={kardexSeleccionadoParaSalida}
          liquidaciones={liquidaciones}
          fechaSeleccionada={fechaSalidaSeleccionada}
        />
      </div>
    </ResponsiveContainer>
  )
}

export default LiquidacionesPage
