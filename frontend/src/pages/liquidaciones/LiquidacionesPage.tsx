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
} from "@ant-design/icons"
import {
  Button,
  Table,
  Tag,
  Upload,
  Card,
  message,
  Modal,
  Spin,
  Input,
  Select,
} from "antd"
import type { UploadProps, TableColumnsType } from "antd"
import { TItemLiquidacion, TLiquidacion, TSaldoKardex } from "@/types/liquidacion"
import { procesarPDFCompleto } from "@/utils/pdfProcessor"
import * as liquidacionService from "@/services/liquidacionService"
import toast from "react-hot-toast"
import ResponsiveContainer from "@/components/ResponsiveContainer"
import ModalDetalleLiquidacion from "@/components/liquidaciones/ModalDetalleLiquidacion"
import ModalRegistrarSalida from "@/components/liquidaciones/ModalRegistrarSalida"
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

  // Estados para agregar salida
  const [modalSalidaVisible, setModalSalidaVisible] = useState(false)
  const [kardexSeleccionado, setKardexSeleccionado] = useState<string>("")
  const [nuevaSalida, setNuevaSalida] = useState({
    fecha: dayjs(),
    proveedor: "",
    ruc_dni: "",
    cantidad_salida: 0,
    costo_unitario: 0,
  })

  // Estados para edición de items
  const [editandoItem, setEditandoItem] = useState<{ [key: number]: boolean }>({})
  const [itemEditado, setItemEditado] = useState<{ [key: number]: TItemLiquidacion }>({})

  // Estados para previsualización de PDF agregado
  const [modalPrevisualizacionVisible, setModalPrevisualizacionVisible] = useState(false)
  const [itemsPrevisualizacion, setItemsPrevisualizacion] = useState<TItemLiquidacion[]>([])
  const [nombreArchivoPrevisualizacion, setNombreArchivoPrevisualizacion] = useState("")
  const [editandoKardexPreview, setEditandoKardexPreview] = useState<{ [key: number]: boolean }>({})
  const [kardexEditadoPreview, setKardexEditadoPreview] = useState<{ [key: number]: string }>({})

  // Estados para filtros
  const [filtroDocumento, setFiltroDocumento] = useState<string>("")
  const [filtroMes, setFiltroMes] = useState<string>("")

  // Función helper para ordenar items
  const ordenarItems = (items: TItemLiquidacion[]): TItemLiquidacion[] => {
    return [...items].sort((a, b) => {
      // Primero ordenar por kardex
      if (a.kardex !== b.kardex) {
        return a.kardex.localeCompare(b.kardex)
      }
      // Dentro del mismo kardex, ingresos primero, salidas después
      // Inferir el tipo basándose en ingreso/salida si no está definido
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

  // Abrir modal para agregar salida
  const handleAbrirModalSalida = (kardex: string) => {
    setKardexSeleccionado(kardex)
    const saldo = calcularSaldosPorKardex.find((s) => s.kardex === kardex)
    setNuevaSalida({
      fecha: dayjs(),
      proveedor: "",
      ruc_dni: "",
      cantidad_salida: saldo?.saldo_pendiente || 0,
      costo_unitario: saldo?.costo_promedio || 0,
    })
    setModalSalidaVisible(true)
  }

  // Guardar nueva salida
  const handleGuardarSalida = () => {
    if (!liquidacionActual || !kardexSeleccionado) return

    if (!nuevaSalida.proveedor || !nuevaSalida.ruc_dni || nuevaSalida.cantidad_salida <= 0) {
      toast.error("Por favor completa todos los campos correctamente")
      return
    }

    const saldo = calcularSaldosPorKardex.find((s) => s.kardex === kardexSeleccionado)
    if (!saldo) return

    if (nuevaSalida.cantidad_salida > saldo.saldo_pendiente) {
      toast.error(
        `La cantidad de salida (${nuevaSalida.cantidad_salida}) no puede ser mayor al saldo pendiente (${saldo.saldo_pendiente})`
      )
      return
    }

    // Crear el nuevo item de salida
    const nuevoItemSalida: TItemLiquidacion = {
      kardex: kardexSeleccionado,
      descripcion: saldo.descripcion,
      fecha: nuevaSalida.fecha.format("DD/MM/YYYY"),
      proveedor: nuevaSalida.proveedor,
      ruc_dni: nuevaSalida.ruc_dni,
      ingreso: 0,
      salida: nuevaSalida.cantidad_salida,
      costo_unitario: nuevaSalida.costo_unitario,
      total: nuevaSalida.cantidad_salida * nuevaSalida.costo_unitario,
      tipo: "salida",
    }

    // Agregar la salida
    const todosLosItems = [...liquidacionActual.items, nuevoItemSalida]
    const nuevoTotalGeneral = todosLosItems.reduce((sum, item) => sum + Number(item.total), 0)

    actualizarLiquidacion({
      items: todosLosItems,
      total_items: liquidacionActual.total_items + 1,
      total_general: nuevoTotalGeneral,
    })

    setModalSalidaVisible(false)
    toast.success("Salida registrada. Haz clic en 'Guardar Cambios' para persistir en la BD")
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

  // Obtener documentos únicos para el filtro
  const documentosUnicos = useMemo(() => {
    return Array.from(new Set(liquidaciones.map(l => l.numero_documento))).sort()
  }, [liquidaciones])

  // Obtener meses únicos para el filtro
  const mesesUnicos = useMemo(() => {
    const meses = liquidaciones.map(l => {
      const fecha = new Date(l.fecha_procesamiento)
      return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    })
    return Array.from(new Set(meses)).sort().reverse()
  }, [liquidaciones])

  // Filtrar liquidaciones
  const liquidacionesFiltradas = useMemo(() => {
    let filtradas = [...liquidaciones]

    if (filtroDocumento) {
      filtradas = filtradas.filter(l => l.numero_documento === filtroDocumento)
    }

    if (filtroMes) {
      filtradas = filtradas.filter(l => {
        const fecha = new Date(l.fecha_procesamiento)
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        return mes === filtroMes
      })
    }

    return filtradas
  }, [liquidaciones, filtroDocumento, filtroMes])

  // Agrupar liquidaciones por mes
  const liquidacionesAgrupadasPorMes = useMemo(() => {
    const grupos: { [key: string]: TLiquidacion[] } = {}

    liquidacionesFiltradas.forEach(liquidacion => {
      const fecha = new Date(liquidacion.fecha_procesamiento)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

      if (!grupos[mesKey]) {
        grupos[mesKey] = []
      }
      grupos[mesKey].push(liquidacion)
    })

    // Convertir a array y ordenar por mes (más reciente primero)
    return Object.entries(grupos)
      .map(([key, items]) => {
        const [year, month] = key.split('-')
        const fecha = new Date(Number(year), Number(month) - 1, 1)
        return {
          mesKey: key,
          mesNombre: fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' }),
          liquidaciones: items.sort((a, b) =>
            new Date(b.fecha_procesamiento).getTime() - new Date(a.fecha_procesamiento).getTime()
          )
        }
      })
      .sort((a, b) => b.mesKey.localeCompare(a.mesKey))
  }, [liquidacionesFiltradas])

  // Columnas de la tabla de liquidaciones
  const columnasLiquidaciones: TableColumnsType<TLiquidacion> = [
    {
      title: "Nº Documento",
      dataIndex: "numero_documento",
      key: "numero_documento",
      render: (text) => <strong>{text}</strong>,
      sorter: (a, b) => a.numero_documento.localeCompare(b.numero_documento),
    },
    {
      title: "Archivo",
      dataIndex: "nombre_archivo",
      key: "nombre_archivo",
      render: (text) => (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          {text}
        </span>
      ),
    },
    {
      title: "Fecha Procesamiento",
      dataIndex: "fecha_procesamiento",
      key: "fecha_procesamiento",
      render: (date) => new Date(date).toLocaleDateString("es-PE"),
      sorter: (a, b) => new Date(a.fecha_procesamiento).getTime() - new Date(b.fecha_procesamiento).getTime(),
    },
    {
      title: "Items",
      dataIndex: "total_items",
      key: "total_items",
      align: "center",
    },
    {
      title: "Total",
      dataIndex: "total_general",
      key: "total_general",
      render: (total) => `S/ ${Number(total).toFixed(2)}`,
      align: "right",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={estado === "procesado" ? "green" : estado === "error" ? "red" : "orange"}>
          {estado.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
          >
            Ver
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEliminar(record.id!)}
          >
            Eliminar
          </Button>
        </div>
      ),
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
            title={`Liquidaciones Procesadas (${liquidacionesFiltradas.length}${filtroDocumento || filtroMes ? ` de ${liquidaciones.length}` : ''})`}
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
                  placeholder="Filtrar por mes"
                  style={{ width: 200 }}
                  allowClear
                  value={filtroMes || undefined}
                  onChange={(value) => setFiltroMes(value || "")}
                  options={mesesUnicos.map(mes => {
                    const [year, month] = mes.split('-')
                    const fecha = new Date(Number(year), Number(month) - 1)
                    const label = fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })
                    return { label, value: mes }
                  })}
                />
              </div>
            }
          >
            {liquidacionesAgrupadasPorMes.map((grupo) => (
              <div key={grupo.mesKey} className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg mb-3 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 capitalize">
                    {grupo.mesNombre}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({grupo.liquidaciones.length} {grupo.liquidaciones.length === 1 ? 'liquidación' : 'liquidaciones'})
                    </span>
                  </h3>
                </div>
                <Table
                  columns={columnasLiquidaciones}
                  dataSource={grupo.liquidaciones}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  loading={cargando}
                  size="small"
                />
              </div>
            ))}
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
                <strong>Nota:</strong> Puedes editar el número de kardex haciendo clic en el ícono de edición. Se guardarán todas las liquidaciones al confirmar.
              </div>

              {/* Lista de liquidaciones */}
              {liquidacionesActuales.map((liquidacion, liqIndex) => (
                <div key={liqIndex} className="border-2 border-blue-300 rounded-lg overflow-hidden shadow-md">
                  {/* Cabecera de la liquidación */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">
                          Liquidación #{liqIndex + 1}: {liquidacion.numero_documento}
                        </h3>
                        <p className="text-sm text-blue-100 mt-1">{liquidacion.nombre_archivo}</p>
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

        {/* Modal de detalle con edición y gestión de salidas */}
        <ModalDetalleLiquidacion
          visible={detalleVisible}
          liquidacion={liquidacionActual}
          saldos={calcularSaldosPorKardex}
          onClose={() => setDetalleVisible(false)}
          onGuardar={handleActualizarLiquidacion}
          onAbrirModalSalida={handleAbrirModalSalida}
          onEditarItem={handleEditarItem}
          onGuardarItem={handleGuardarItem}
          onCancelarEdicionItem={handleCancelarEdicionItem}
          editandoItem={editandoItem}
          itemEditado={itemEditado}
          setItemEditado={setItemEditado}
          guardando={guardando}
          uploadAgregarPDFProps={uploadAgregarPDFProps}
          procesando={procesando}
        />

        {/* Modal para registrar salida */}
        <ModalRegistrarSalida
          visible={modalSalidaVisible}
          kardexSeleccionado={kardexSeleccionado}
          saldos={calcularSaldosPorKardex}
          nuevaSalida={nuevaSalida}
          setNuevaSalida={setNuevaSalida}
          onGuardar={handleGuardarSalida}
          onCancelar={() => setModalSalidaVisible(false)}
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
      </div>
    </ResponsiveContainer>
  )
}

export default LiquidacionesPage
