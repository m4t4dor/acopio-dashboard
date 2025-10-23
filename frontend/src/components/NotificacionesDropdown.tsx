import { Badge, Button, Empty, List, Popover, Spin, Typography, message } from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import useNotificacionesStore from '@/stores/notificacionesStore'
import { notificacionesService, TNotificacion } from '@/services/notificaciones.service'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

const { Text } = Typography

const NotificacionesDropdown = () => {
	const { 
		notificaciones, 
		noLeidas, 
		loading,
		marcarComoLeida,
		marcarTodasComoLeidas,
		eliminarNotificacion,
		cargarNotificaciones
	} = useNotificacionesStore()

	const [open, setOpen] = useState(false)

	// Cargar notificaciones al montar el componente
	useEffect(() => {
		cargarNotificaciones()
	}, [])

	const handleMarcarComoLeida = async (notificacion: TNotificacion) => {
		if (notificacion.es_leida) return

		try {
			await notificacionesService.marcarComoLeida(notificacion.id)
			marcarComoLeida(notificacion.id)
		} catch (error) {
			console.error('Error al marcar como leída:', error)
			message.error('Error al marcar la notificación como leída')
		}
	}

	const handleMarcarTodasComoLeidas = async () => {
		try {
			await notificacionesService.marcarTodasComoLeidas()
			marcarTodasComoLeidas()
			message.success('Todas las notificaciones marcadas como leídas')
		} catch (error) {
			console.error('Error al marcar todas como leídas:', error)
			message.error('Error al marcar las notificaciones como leídas')
		}
	}

	const handleEliminarNotificacion = async (id: number, event: React.MouseEvent) => {
		event.stopPropagation()
		
		try {
			await notificacionesService.eliminarNotificacion(id)
			eliminarNotificacion(id)
			message.success('Notificación eliminada')
		} catch (error) {
			console.error('Error al eliminar notificación:', error)
			message.error('Error al eliminar la notificación')
		}
	}

	const getIconForTipo = (tipo: string) => {
		switch (tipo) {
			case 'AUTORIZACION_PRESTAMO':
				return '🔐'
			case 'PRESTAMO_VENCIDO':
				return '⚠️'
			case 'PAGO_RECIBIDO':
				return '💰'
			default:
				return '📢'
		}
	}

	const content = (
		<div style={{ width: 350, maxHeight: 400 }}>
			<div className="flex justify-between items-center p-3 border-b">
				<Text strong>Notificaciones</Text>
				{noLeidas > 0 && (
					<Button 
						size="small" 
						type="link" 
						icon={<CheckOutlined />}
						onClick={handleMarcarTodasComoLeidas}
					>
						Marcar todas como leídas
					</Button>
				)}
			</div>

			{loading ? (
				<div className="flex justify-center p-4">
					<Spin />
				</div>
			) : notificaciones.length === 0 ? (
				<div className="p-4">
					<Empty 
						description="No hay notificaciones" 
						image={Empty.PRESENTED_IMAGE_SIMPLE}
					/>
				</div>
			) : (
				<List
					dataSource={notificaciones}
					renderItem={(notificacion) => (
						<List.Item
							className={`cursor-pointer hover:bg-gray-50 ${!notificacion.es_leida ? 'bg-blue-50' : ''}`}
							onClick={() => handleMarcarComoLeida(notificacion)}
							actions={[
								<Button
									key="delete"
									type="text"
									size="small"
									icon={<DeleteOutlined />}
									onClick={(e) => handleEliminarNotificacion(notificacion.id, e)}
									danger
								/>
							]}
						>
							<List.Item.Meta
								avatar={
									<div className="text-lg">
										{getIconForTipo(notificacion.tipo)}
									</div>
								}
								title={
									<div className="flex items-center gap-2">
										<Text strong={!notificacion.es_leida}>
											{notificacion.titulo}
										</Text>
										{!notificacion.es_leida && (
											<div className="w-2 h-2 bg-blue-500 rounded-full" />
										)}
									</div>
								}
								description={
									<div>
										<Text type="secondary" className="text-sm">
											{notificacion.mensaje}
										</Text>
										<div className="mt-1">
											<Text type="secondary" className="text-xs">
												{dayjs(notificacion.created_at).fromNow()}
											</Text>
										</div>
										{notificacion.tipo === 'autorizacion' && notificacion.codigo && (
											<div className="mt-2 p-2 bg-yellow-100 rounded">
												<Text code strong>
													Código: {notificacion.codigo}
												</Text>
											</div>
										)}
									</div>
								}
							/>
						</List.Item>
					)}
					style={{ maxHeight: 300, overflow: 'auto' }}
				/>
			)}
		</div>
	)

	return (
		<Popover
			content={content}
			title={null}
			trigger="click"
			open={open}
			onOpenChange={setOpen}
			placement="bottomRight"
		>
			<Badge count={noLeidas} size="small">
				<Button 
					type="text" 
					icon={<BellOutlined />} 
					className="flex items-center justify-center"
					size="large"
				/>
			</Badge>
		</Popover>
	)
}

export default NotificacionesDropdown
