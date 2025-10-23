// Descarga directa del backup generado
export async function crearYDescargarBackup(): Promise<void> {
	const response = await axiosInstance.post(
		"/configuracion/backups/crear",
		{},
		{ responseType: "blob" }
	);
	// Si el backend no envía el nombre correcto, lo generamos aquí
	let filename = "backup.sql";
	const now = new Date();
	const pad = (n: number) => n.toString().padStart(2, '0');
	const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
	// Si tienes el nombre de la base de datos en el frontend, cámbialo aquí:
	const dbName = 'db'; // O pon el nombre real si lo tienes
	filename = `backup${dbName ? dbName : 'db'}_${timestamp}.sql`;
	// Si el backend envía el nombre, úsalo
	const disposition = response.headers["content-disposition"];
	if (disposition) {
		const match = disposition.match(/filename="?([^"\n]+)"?/);
		if (match) filename = match[1];
	}
	const url = window.URL.createObjectURL(new Blob([response.data]));
	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
}
import axiosInstance from "@/libs/axios"

export interface BackupInfo {
	filename: string
	size: string
	fecha_creacion: string
}

export interface SystemInfo {
	base_datos: {
		tipo: string
		host: string
		puerto: string
		base_datos: string
		tamaño: string
	}
	servidor: {
		php_version: string
		laravel_version: string
		servidor: string
		sistema_operativo: string
	}
}

export interface BackupResponse {
	status: string
	message: string
	content: {
		filename: string
		size: string
		timestamp: string
		fecha_creacion: string
	}
}

export interface BackupListResponse {
	status: string
	message: string
	content: {
		backups: BackupInfo[]
		total: number
	}
}

export interface SystemInfoResponse {
	status: string
	message: string
	content: SystemInfo
}

export const configuracionService = {
	// Información del sistema
	async obtenerInformacionSistema(): Promise<SystemInfoResponse> {
		const response = await axiosInstance.get<SystemInfoResponse>(
			"/configuracion/sistema/informacion"
		)
		return response.data
	},

	// Copias de seguridad
	async crearCopiaSeguridad(): Promise<BackupResponse> {
		const response = await axiosInstance.post<BackupResponse>(
			"/configuracion/backups/crear"
		)
		return response.data
	},

	async descargarCopiaSeguridad(filename: string): Promise<void> {
		const response = await axiosInstance.get(
			`/configuracion/backups/${filename}/descargar`,
			{
				responseType: 'blob'
			}
		)

		// Crear un enlace de descarga
		const url = window.URL.createObjectURL(new Blob([response.data]))
		const link = document.createElement('a')
		link.href = url
		link.setAttribute('download', filename)
		document.body.appendChild(link)
		link.click()
		link.remove()
		window.URL.revokeObjectURL(url)
	},
}
