import fs from "fs"
import path from "path"
import readline from "readline"

// Crear la interfaz para pedir datos por consola
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

// Función para preguntar y devolver una promesa
function ask(question) {
	return new Promise((resolve) => rl.question(question, resolve))
}

;(async () => {
	try {
		// Solicitar la ruta donde se crearán los archivos (la ruta se asume que existe)
		let outputDir = await ask("Ingresa la ruta donde se crearán los archivos src/: ")
		outputDir = "src/" + outputDir

        // Crear directorio si no existe
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

		// Archivo de entrada fijo
		const contentFilePath = "./generate-input.txt"

		// Leer el archivo de contenido
		const data = fs.readFileSync(contentFilePath, "utf8")

		// Expresión regular para capturar bloques entre begin::NOMBRE y end::NOMBRE
		const regex = /begin::(.+)\r?\n([\s\S]*?)end::\1/g
		let match
		let fileCount = 0

		while ((match = regex.exec(data)) != null) {
			const fileName = match[1].trim()
			const fileContent = match[2].trim() + "\n" // Agrega salto de línea final
			const filePath = path.join(outputDir, fileName)

			fs.writeFileSync(filePath, fileContent, "utf8")
			console.log(`Archivo creado: ${filePath}`)
			fileCount++
		}

		if (fileCount == 0) {
			console.log("No se encontraron bloques de archivos para procesar.")
		} else {
			console.log(`Se han creado ${fileCount} archivo(s).`)
		}
	} catch (error) {
		console.error("Error durante el procesamiento:", error)
	} finally {
		rl.close()
	}
})()
