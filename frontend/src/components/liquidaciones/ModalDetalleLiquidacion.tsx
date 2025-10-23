import {
  Modal,
  Button,
  Tag,
  Table,
  Divider,
  Card,
  Space,
  Input,
  InputNumber,
} from "antd"
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  FileAddOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons"
import { Upload } from "antd"
import type { UploadProps, TableColumnsType } from "antd"
import { TItemLiquidacion, TLiquidacion, TSaldoKardex } from "@/types/liquidacion"

interface ModalDetalleLiquidacionProps {
  visible: boolean
  liquidacion: TLiquidacion | null
  saldos: TSaldoKardex[]
  onClose: () => void
  onGuardar: () => void
  onAbrirModalSalida: (kardex: string) => void
  onEditarItem: (index: number, item: TItemLiquidacion) => void
  onGuardarItem: (index: number) => void
  onCancelarEdicionItem: (index: number) => void
  editandoItem: { [key: number]: boolean }
  itemEditado: { [key: number]: TItemLiquidacion }
  setItemEditado: React.Dispatch<React.SetStateAction<{ [key: number]: TItemLiquidacion }>>
  guardando: boolean
  uploadAgregarPDFProps: UploadProps
  procesando: boolean
}

const ModalDetalleLiquidacion: React.FC<ModalDetalleLiquidacionProps> = ({
  visible,
  liquidacion,
  saldos,
  onClose,
  onGuardar,
  onAbrirModalSalida,
  onEditarItem,
  onGuardarItem,
  onCancelarEdicionItem,
  editandoItem,
  itemEditado,
  setItemEditado,
  guardando,
  uploadAgregarPDFProps,
  procesando,
}) => {
  // Columnas para la tabla de items con edición
  const columnasItemsEditable: TableColumnsType<any> = [
    {
      title: "Kardex",
      dataIndex: "kardex",
      key: "kardex",
      width: 70,
      align: "center",
      render: (text, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <Input
              value={itemEditado[originalIndex]?.kardex || text}
              onChange={(e) =>
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { ...itemEditado[originalIndex], kardex: e.target.value },
                })
              }
              style={{ width: 60 }}
              size="small"
            />
          )
        }
        return <strong className="text-blue-600 text-xs">{text}</strong>
      },
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 90,
      render: (text, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <Input
              value={itemEditado[originalIndex]?.fecha || text}
              onChange={(e) =>
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { ...itemEditado[originalIndex], fecha: e.target.value },
                })
              }
              style={{ width: 80 }}
              size="small"
            />
          )
        }
        return <span className="text-xs">{text}</span>
      },
    },
    {
      title: "Proveedor",
      dataIndex: "proveedor",
      key: "proveedor",
      width: 180,
      ellipsis: true,
      render: (text, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <Input
              value={itemEditado[originalIndex]?.proveedor || text}
              onChange={(e) =>
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { ...itemEditado[originalIndex], proveedor: e.target.value },
                })
              }
              size="small"
            />
          )
        }
        return <span className="text-xs truncate block" title={text}>{text}</span>
      },
    },
    {
      title: "RUC/DNI",
      dataIndex: "ruc_dni",
      key: "ruc_dni",
      width: 100,
      render: (text, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <Input
              value={itemEditado[originalIndex]?.ruc_dni || text}
              onChange={(e) =>
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { ...itemEditado[originalIndex], ruc_dni: e.target.value },
                })
              }
              style={{ width: 90 }}
              size="small"
            />
          )
        }
        return <span className="text-xs">{text}</span>
      },
    },
    {
      title: "Ingreso",
      dataIndex: "ingreso",
      key: "ingreso",
      align: "right",
      width: 80,
      render: (value, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <InputNumber
              value={itemEditado[originalIndex]?.ingreso || Number(value)}
              onChange={(val) => {
                const ingreso = val || 0
                const itemActual = itemEditado[originalIndex] || record
                const costoUnitario = Number(itemActual.costo_unitario)
                const nuevoTotal = ingreso * costoUnitario
                
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { 
                    ...itemEditado[originalIndex], 
                    ingreso: ingreso,
                    total: nuevoTotal
                  },
                })
              }}
              style={{ width: 70 }}
              size="small"
              min={0}
            />
          )
        }
        return Number(value) > 0 ? <span className="text-xs font-medium text-green-600">{Number(value)}</span> : <span className="text-gray-400">-</span>
      },
    },
    {
      title: "Salida",
      dataIndex: "salida",
      key: "salida",
      align: "right",
      width: 80,
      render: (value, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <InputNumber
              value={itemEditado[originalIndex]?.salida || Number(value)}
              onChange={(val) => {
                const salida = val || 0
                const itemActual = itemEditado[originalIndex] || record
                const costoUnitario = Number(itemActual.costo_unitario)
                const nuevoTotal = salida * costoUnitario
                
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { 
                    ...itemEditado[originalIndex], 
                    salida: salida,
                    total: nuevoTotal
                  },
                })
              }}
              style={{ width: 70 }}
              size="small"
              min={0}
            />
          )
        }
        return Number(value) > 0 ? <span className="text-xs font-medium text-blue-600">{Number(value)}</span> : <span className="text-gray-400">-</span>
      },
    },
    {
      title: "C. Unit.",
      dataIndex: "costo_unitario",
      key: "costo_unitario",
      align: "right",
      width: 80,
      render: (value, record) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <InputNumber
              value={itemEditado[originalIndex]?.costo_unitario || Number(value)}
              onChange={(val) => {
                const costoUnitario = val || 0
                const itemActual = itemEditado[originalIndex] || record
                const cantidad = Number(itemActual.ingreso) > 0 ? Number(itemActual.ingreso) : Number(itemActual.salida)
                const nuevoTotal = cantidad * costoUnitario
                
                setItemEditado({
                  ...itemEditado,
                  [originalIndex]: { 
                    ...itemEditado[originalIndex], 
                    costo_unitario: costoUnitario,
                    total: nuevoTotal
                  },
                })
              }}
              style={{ width: 70 }}
              size="small"
              min={0}
              precision={2}
            />
          )
        }
        return <span className="text-xs">S/ {Number(value).toFixed(2)}</span>
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      width: 90,
      render: (value, record) => {
        const originalIndex = record.originalIndex
        // Si está en modo edición, mostrar el total calculado
        if (editandoItem[originalIndex] && itemEditado[originalIndex]) {
          return <strong className="text-xs">S/ {Number(itemEditado[originalIndex].total || value).toFixed(2)}</strong>
        }
        return <strong className="text-xs">S/ {Number(value).toFixed(2)}</strong>
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 100,
      fixed: 'right',
      render: (_: any, record: any) => {
        const originalIndex = record.originalIndex
        if (editandoItem[originalIndex]) {
          return (
            <Space size="small" direction="vertical" className="w-full">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => onGuardarItem(originalIndex)}
                block
                className="text-xs h-6"
              />
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => onCancelarEdicionItem(originalIndex)}
                block
                className="text-xs h-6"
              />
            </Space>
          )
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditarItem(originalIndex, record)}
            className="text-xs p-0"
          >
            Editar
          </Button>
        )
      },
    },
  ]

  if (!liquidacion) return null

  return (
    <Modal
      title={<span className="text-base font-semibold">Detalle - {liquidacion.numero_documento}</span>}
      open={visible}
      onCancel={onClose}
      width="90vw"
      centered
      style={{ 
        top: 20,
        maxWidth: 1600,
      }}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
        }
      }}
      footer={null}
    >
      <div className="space-y-4">
        {/* Información general */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded shadow-sm">
          <div>
            <span className="text-gray-600 text-sm">Documento:</span>
            <p className="font-semibold">{liquidacion.numero_documento}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Archivo:</span>
            <p className="font-semibold truncate">{liquidacion.nombre_archivo}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Fecha:</span>
            <p className="font-semibold">
              {new Date(liquidacion.fecha_procesamiento).toLocaleDateString("es-PE")}
            </p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Estado:</span>
            <Tag
              color={
                liquidacion.estado === "procesado"
                  ? "green"
                  : liquidacion.estado === "error"
                  ? "red"
                  : "orange"
              }
            >
              {liquidacion.estado.toUpperCase()}
            </Tag>
          </div>
        </div>

        {/* Cuadro de ayuda: Saldos por Kardex - Versión compacta */}
        {saldos.length > 0 && (
          <Card
            size="small"
            title={
              <div className="flex items-center gap-2 text-sm">
                <InfoCircleOutlined className="text-blue-500" />
                <span>Resumen de Saldos por Kardex</span>
              </div>
            }
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {saldos.map((saldo) => (
                <div
                  key={saldo.kardex}
                  className={`p-3 rounded-lg border ${
                    saldo.saldo_pendiente > 0
                      ? "border-orange-200 bg-orange-50/50"
                      : "border-green-200 bg-green-50/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-blue-700 truncate">
                      KARDEX {saldo.kardex}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Ingreso</div>
                        <div className="font-bold text-green-600">{saldo.total_ingreso}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Salida</div>
                        <div className="font-bold text-blue-600">{saldo.total_salida}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Pendiente</div>
                        <div
                          className={`font-bold text-base ${
                            saldo.saldo_pendiente > 0 ? "text-orange-600" : "text-green-600"
                          }`}
                        >
                          {saldo.saldo_pendiente}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Costo Prom.</div>
                        <div className="font-semibold text-gray-700">
                          S/ {saldo.costo_promedio.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {saldo.saldo_pendiente > 0 && (
                      <Button
                        type="primary"
                        size="small"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => onAbrirModalSalida(saldo.kardex)}
                        className="text-xs h-7"
                      >
                        Registrar Salida
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Divider className="my-3">
          <span className="text-sm text-gray-500">Items de Liquidación (Editable)</span>
        </Divider>

        {/* Agrupar por Kardex */}
        <div className="space-y-3">
        {Array.from(new Set(liquidacion.items.map((item) => item.kardex))).map((kardex) => {
          const itemsKardex = liquidacion.items
            .map((item, index) => ({ ...item, originalIndex: index }))
            .filter((item) => item.kardex === kardex)

          return (
            <div key={kardex} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 font-semibold text-sm border-b border-blue-200 flex items-center justify-between">
                <span className="text-blue-800">
                  KARDEX {kardex} - {itemsKardex[0]?.descripcion}
                </span>
                <span className="text-xs text-gray-600">
                  {itemsKardex.length} {itemsKardex.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <Table
                columns={columnasItemsEditable}
                dataSource={itemsKardex}
                rowKey={(record) => `${record.kardex}-${record.originalIndex}`}
                pagination={false}
                size="small"
                rowClassName={(record) => (record.tipo === "salida" ? "bg-blue-50" : "")}
              />
            </div>
          )
        })}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 pt-12 flex justify-end gap-3 sticky z-50" style={{ 
          bottom: '-40px',
          background: 'linear-gradient(to top, #ffffff 0%, #ffffff 85%, rgba(255,255,255,0.98) 92%, rgba(255,255,255,0) 100%)',
          boxShadow: '0 -8px 16px -4px rgba(0, 0, 0, 0.08)',
          marginLeft: '-20px',
          marginRight: '-20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          marginBottom: '-40px',
          paddingBottom: '44px',
        }}>
          <Upload {...uploadAgregarPDFProps} showUploadList={false}>
            <Button icon={<FileAddOutlined />} loading={procesando}>
              Agregar PDF
            </Button>
          </Upload>
          <Button onClick={onClose}>
            Cerrar
          </Button>
          <Button type="primary" onClick={onGuardar} loading={guardando}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalDetalleLiquidacion
