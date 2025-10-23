import { create } from 'zustand'
import { TNotificacion, notificacionesService } from '@/services/notificaciones.service'

interface NotificacionesState {
	notificaciones: TNotificacion[]
	noLeidas: number
	loading: boolean
	
	// Actions
	setNotificaciones: (notificaciones: TNotificacion[]) => void
	agregarNotificacion: (notificacion: TNotificacion) => void
	marcarComoLeida: (id: number) => void
	marcarTodasComoLeidas: () => void
	eliminarNotificacion: (id: number) => void
	setNoLeidas: (cantidad: number) => void
	setLoading: (loading: boolean) => void
	cargarNotificaciones: () => Promise<void>
}

const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
	notificaciones: [],
	noLeidas: 0,
	loading: false,

	setNotificaciones: (notificaciones) => set({ notificaciones }),
	
	agregarNotificacion: (notificacion) => {
		const { notificaciones } = get()
		set({ 
			notificaciones: [notificacion, ...notificaciones],
			noLeidas: get().noLeidas + 1
		})
	},
	
	marcarComoLeida: (id) => {
		const { notificaciones, noLeidas } = get()
		const updatedNotificaciones = notificaciones.map(notif => 
			notif.id === id ? { ...notif, es_leida: true } : notif
		)
		set({ 
			notificaciones: updatedNotificaciones,
			noLeidas: Math.max(0, noLeidas - 1)
		})
	},
	
	marcarTodasComoLeidas: () => {
		const { notificaciones } = get()
		const updatedNotificaciones = notificaciones.map(notif => ({ ...notif, es_leida: true }))
		set({ 
			notificaciones: updatedNotificaciones,
			noLeidas: 0
		})
	},
	
	eliminarNotificacion: (id) => {
		const { notificaciones } = get()
		const notificacion = notificaciones.find(n => n.id === id)
		const updatedNotificaciones = notificaciones.filter(notif => notif.id !== id)
		set({ 
			notificaciones: updatedNotificaciones,
			noLeidas: notificacion && !notificacion.es_leida ? get().noLeidas - 1 : get().noLeidas
		})
	},
	
	setNoLeidas: (cantidad) => set({ noLeidas: cantidad }),
	
	setLoading: (loading) => set({ loading }),

	cargarNotificaciones: async () => {
		try {
			set({ loading: true })
			const response = await notificacionesService.obtenerNotificaciones()
			
			if (response.success) {
				const data = response.content.notificaciones.data || []
				const noLeidas = data.filter((n: TNotificacion) => !n.es_leida).length
				
				set({ 
					notificaciones: data,
					noLeidas: noLeidas
				})
			}
		} catch (error) {
			console.error('Error al cargar notificaciones:', error)
		} finally {
			set({ loading: false })
		}
	}
}))

export default useNotificacionesStore
