import axiosInstance from "@/libs/axios"

export interface TNotificacion {
	id: number;
	titulo: string;
	mensaje: string;
	tipo: 'autorizacion' | 'prestamo' | 'pago' | 'general';
	usuario_id: number;
	codigo?: string;
	es_leida: boolean;
	created_at: string;
	updated_at: string;
	usuario?: {
		id: number;
		nombre_completo: string;
		username: string;
	};
}

export interface TNotificacionCrear {
	titulo: string;
	mensaje: string;
	tipo: 'autorizacion' | 'prestamo' | 'pago' | 'general';
	usuario_id: number;
	codigo?: string;
}

export const notificacionesService = {
	// Obtener notificaciones del usuario actual
	obtenerNotificaciones: async (params?: any) => {
		const response = await axiosInstance.get('/notificaciones', { params })
		return response.data
	},

	// Obtener todas las notificaciones (solo administradores)
	obtenerTodasNotificaciones: async (params?: any) => {
		const response = await axiosInstance.get('/notificaciones/todas', { params })
		return response.data
	},

	// Crear nueva notificación
	crearNotificacion: async (data: TNotificacionCrear) => {
		const response = await axiosInstance.post('/notificaciones', data)
		return response.data
	},

	// Marcar notificación como leída
	marcarComoLeida: async (notificacionId: number) => {
		const response = await axiosInstance.put(`/notificaciones/${notificacionId}/leida`)
		return response.data
	},

	// Marcar todas como leídas
	marcarTodasComoLeidas: async () => {
		const response = await axiosInstance.put('/notificaciones/marcar-todas-leidas')
		return response.data
	},

	// Eliminar notificación
	eliminarNotificacion: async (notificacionId: number) => {
		const response = await axiosInstance.delete(`/notificaciones/${notificacionId}`)
		return response.data
	},

	// Obtener cantidad de notificaciones no leídas
	obtenerContadorNoLeidas: async () => {
		const response = await axiosInstance.get('/notificaciones/no-leidas/contar')
		return response.data
	},

	// Obtener notificación por código (para autorización)
	obtenerPorCodigo: async (codigo: string) => {
		const response = await axiosInstance.get(`/notificaciones/codigo/${codigo}`)
		return response.data
	}
}
