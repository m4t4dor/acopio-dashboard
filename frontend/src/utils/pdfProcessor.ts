import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import { TItemLiquidacion, TLiquidacion } from '@/types/liquidacion'
import { buscarKardex } from '@/pages/referencias/referencias.service'

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

interface PDFProcessResult {
  text: string
  images: string[]
}

/**
 * Extrae texto de un PDF usando PDF.js
 */
export async function extractTextFromPDF(file: File): Promise<PDFProcessResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  let fullText = ''
  const images: string[] = []
  
  // Procesar cada página
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    
    fullText += pageText + '\n'
    
    // Obtener el viewport y renderizar la página como imagen para OCR
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    images.push(canvas.toDataURL('image/png'))
  }
  
  return { text: fullText, images }
}

/**
 * Realiza OCR en imágenes usando Tesseract.js
 */
export async function performOCR(images: string[]): Promise<string> {
  const worker = await createWorker('spa')
  let ocrText = ''
  
  for (const image of images) {
    const { data } = await worker.recognize(image)
    ocrText += data.text + '\n'
  }
  
  await worker.terminate()
  return ocrText
}

/**
 * Parsea el texto extraído para obtener los datos de la liquidación
 */
export async function parseLiquidacionData(text: string, filename: string): Promise<TLiquidacion> {
  const items: TItemLiquidacion[] = []
  
  // Buscar RUC del documento
  const rucMatch = text.match(/RUC\s*:?\s*(\d+)/i)
  const numeroDocumento = rucMatch ? rucMatch[1] : 'SIN-NUMERO'
  
  // Buscar número de factura o documento
  const facturaMatch = text.match(/E\d+\s*-\s*\d+/i)
  const numeroFactura = facturaMatch ? facturaMatch[0] : numeroDocumento
  
  // Buscar fecha de emisión
  const fechaMatch = text.match(/Fecha\s+de\s+Emisi[óo]n\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)
  const fechaEmision = fechaMatch ? fechaMatch[1] : new Date().toLocaleDateString('es-PE')
  
  // Buscar proveedor/señor (mejorado con diferentes variantes)
  let proveedor = 'DESCONOCIDO'
  
  // Intentar diferentes patrones
  const patronesProveedor = [
    /Señor\s*\(es\)\s*:\s*(.+?)(?=DNI|RUC)/is,
    /Se[ñn]or\s*\(\s*es\s*\)\s*:\s*(.+?)(?=DNI|RUC)/is,
  ]
  
  for (const patron of patronesProveedor) {
    const match = text.match(patron)
    if (match) {
      // Limpiar el nombre, quitando saltos de línea, espacios extras y otros textos
      let nombreCompleto = match[1]
        .replace(/:/g, '')
        .replace(/Tipo de Moneda/gi, '')
        .replace(/Direcci[óo]n/gi, '')
        .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Quitar fechas
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // Extraer solo nombres en mayúsculas (el patrón común de nombres)
      const nombreMatch = nombreCompleto.match(/([A-ZÁÉÍÓÚÑ\s]{3,})/i)
      if (nombreMatch && nombreMatch[1].trim() !== '') {
        proveedor = nombreMatch[1].trim()
        break
      }
    }
  }
  
  // Buscar DNI
  const dniMatch = text.match(/DNI\s*:?\s*(\d+)/i)
  const dni = dniMatch ? dniMatch[1] : ''
  
  // Extraer items de la tabla (Cantidad, Unidad, Código, Descripción, Valor Unitario)
  const lines = text.split('\n')
  let itemCounter = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Buscar líneas que contengan códigos de producto (números de 7-8 dígitos)
    const itemMatch = line.match(/(\d+\.?\d*)\s+([A-Z]+)\s+(\d{7,8})\s+(.+?)\s+(\d+\.?\d+)/i)
    
    if (itemMatch) {
      const [, cantidad, , codigo, descripcion, valorUnitario] = itemMatch
      
      // Buscar el kardex sugerido en las referencias
      let kardexSugerido = itemCounter.toString()
      try {
        // Primero buscar por código
        const response = await buscarKardex(codigo)
        if (response.data.content.encontrado && response.data.content.num_kardex) {
          kardexSugerido = response.data.content.num_kardex
        } else {
          // Si no encuentra por código, buscar por descripción
          const responseDesc = await buscarKardex(descripcion.trim())
          if (responseDesc.data.content.encontrado && responseDesc.data.content.num_kardex) {
            kardexSugerido = responseDesc.data.content.num_kardex
          }
        }
      } catch (error) {
        console.error('Error buscando kardex en referencias:', error)
        // Si falla la búsqueda, usar el contador
      }
      
      const item: TItemLiquidacion = {
        kardex: kardexSugerido,
        descripcion: descripcion.trim(),
        fecha: fechaEmision,
        proveedor: proveedor,
        ruc_dni: dni,
        ingreso: parseFloat(cantidad.replace(',', '.')),
        salida: 0,
        costo_unitario: parseFloat(valorUnitario.replace(',', '.')),
        total: parseFloat(cantidad.replace(',', '.')) * parseFloat(valorUnitario.replace(',', '.')),
      }
      items.push(item)
      itemCounter++
    }
  }
  
  // Si no encontró items con el patrón anterior, intentar formato alternativo
  if (items.length === 0) {
    items.push(...await parseAlternativeFormatLiquidacion(text, proveedor, dni, fechaEmision))
  }
  
  const totalGeneral = items.reduce((sum, item) => sum + item.total, 0)
  
  return {
    numero_documento: numeroFactura,
    fecha_procesamiento: new Date(),
    nombre_archivo: filename,
    items: items,
    total_items: items.length,
    total_general: totalGeneral,
    estado: items.length > 0 ? 'procesado' : 'error',
  }
}

/**
 * Formato alternativo de parsing para liquidaciones de compra
 */
async function parseAlternativeFormatLiquidacion(text: string, proveedor: string, dni: string, fecha: string): Promise<TItemLiquidacion[]> {
  const items: TItemLiquidacion[] = []
  const lines = text.split('\n')
  let itemCounter = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Buscar líneas con códigos de producto y valores
    // Formato: cantidad unidad codigo descripcion valor
    const parts = line.split(/\s+/)
    
    if (parts.length >= 5) {
      const lastPart = parts[parts.length - 1]
      
      // Verificar si los últimos valores son números (precio)
      if (/^\d+\.?\d*$/.test(lastPart)) {
        const codigoIdx = parts.findIndex(p => /^\d{7,8}$/.test(p))
        
        if (codigoIdx !== -1) {
          const cantidad = parseFloat(parts[0].replace(',', '.'))
          const valorUnitario = parseFloat(lastPart.replace(',', '.'))
          const codigo = parts[codigoIdx]
          
          // Extraer descripción (todo lo que está entre el código y el precio)
          const descripcionParts = parts.slice(codigoIdx + 1, -1)
          const descripcion = descripcionParts.join(' ')
          
          // Buscar el kardex sugerido en las referencias
          let kardexSugerido = itemCounter.toString()
          try {
            // Primero buscar por código
            const response = await buscarKardex(codigo)
            if (response.data.content.encontrado && response.data.content.num_kardex) {
              kardexSugerido = response.data.content.num_kardex
            } else {
              // Si no encuentra por código, buscar por descripción
              const responseDesc = await buscarKardex(descripcion)
              if (responseDesc.data.content.encontrado && responseDesc.data.content.num_kardex) {
                kardexSugerido = responseDesc.data.content.num_kardex
              }
            }
          } catch (error) {
            console.error('Error buscando kardex en referencias:', error)
            // Si falla la búsqueda, usar el contador
          }
          
          const item: TItemLiquidacion = {
            kardex: kardexSugerido,
            descripcion: descripcion,
            fecha: fecha,
            proveedor: proveedor || 'DESCONOCIDO',
            ruc_dni: dni || '',
            ingreso: cantidad || 0,
            salida: 0,
            costo_unitario: valorUnitario,
            total: (cantidad || 0) * valorUnitario,
          }
          items.push(item)
          itemCounter++
        }
      }
    }
  }
  
  return items
}

/**
 * Formato alternativo de parsing para diferentes estructuras de PDF (legacy)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseAlternativeFormat(text: string): TItemLiquidacion[] {
  const items: TItemLiquidacion[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    // Buscar líneas que contengan números de kardex (8 dígitos seguidos de guión)
    const kardexMatch = line.match(/(\d{8})\s*[-–]/)
    if (kardexMatch) {
      // Extraer todos los números de la línea
      const numbers = line.match(/\d+(?:[.,]\d+)?/g)
      if (numbers && numbers.length >= 4) {
        const item: TItemLiquidacion = {
          kardex: kardexMatch[1],
          descripcion: extraerProveedor(line),
          fecha: formatearFecha(kardexMatch[1]),
          proveedor: extraerProveedor(line),
          ruc_dni: numbers[0],
          ingreso: parseFloat(numbers[numbers.length - 4]?.replace(',', '.') || '0'),
          salida: parseFloat(numbers[numbers.length - 3]?.replace(',', '.') || '0'),
          costo_unitario: parseFloat(numbers[numbers.length - 2]?.replace(',', '.') || '0'),
          total: parseFloat(numbers[numbers.length - 1]?.replace(',', '.') || '0'),
        }
        items.push(item)
      }
    }
  }
  
  return items
}

/**
 * Extrae el nombre del proveedor de una línea
 */
function extraerProveedor(line: string): string {
  // Remover números y caracteres especiales para obtener el nombre
  const cleaned = line
    .replace(/\d{8}\s*[-–]/, '')
    .replace(/\d+(?:[.,]\d+)?/g, '')
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, '')
    .trim()
  
  return cleaned || 'DESCONOCIDO'
}

/**
 * Formatea una fecha desde formato DDMMYY
 */
function formatearFecha(dateStr: string): string {
  if (dateStr.length === 8) {
    const day = dateStr.substring(0, 2)
    const month = dateStr.substring(2, 4)
    const year = dateStr.substring(4, 8)
    return `${day}/${month}/${year}`
  }
  return dateStr
}

/**
 * Procesa un archivo PDF completo
 */
export async function procesarPDFCompleto(file: File): Promise<TLiquidacion> {
  try {
    // 1. Extraer texto del PDF
    const { text, images } = await extractTextFromPDF(file)
    
    // 2. Si el texto extraído es muy corto, usar OCR
    let textoFinal = text
    if (text.length < 100 && images.length > 0) {
      console.log('Texto insuficiente, aplicando OCR...')
      textoFinal = await performOCR(images)
    }
    
    // 3. Parsear los datos (ahora es async por la búsqueda en referencias)
    const liquidacion = await parseLiquidacionData(textoFinal, file.name)
    
    return liquidacion
  } catch (error) {
    console.error('Error procesando PDF:', error)
    throw new Error('Error al procesar el archivo PDF')
  }
}
