import pdfMakeInstance from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"
import { ContentTable, TDocumentDefinitions } from "pdfmake/interfaces"

// Asignar las fuentes necesarias
pdfMakeInstance.vfs = pdfFonts.vfs

export type TColumnDefinition<T> = {
	id: string
	header: string
	width?: "*" | "auto" | number
	getValue: (row: T, index: number) => string | number | undefined | null
	emptyValue?: string
}

export const DEFAULT_CONFIGURATION: Omit<TDocumentDefinitions, "content"> = {
	defaultStyle: {
		fontSize: 7,
	},
	styles: {
		header: {
			fontSize: 9,
			bold: true,
		},
		table: {
			fontSize: 7,
		},
	},
	pageOrientation: "portrait",
	pageSize: "A4",
	// pageMargins: [20, 20, 20, 20],
}

type TGenerateTableParams<T> = {
	columns: TColumnDefinition<T>[]
	rows: T[]
	defaultEmptyValue?: string
}

export const generateTable = <T>({ columns, rows, defaultEmptyValue = "-" }: TGenerateTableParams<T>): ContentTable => {
	return {
		style: "table",
		table: {
			headerRows: 1,
			widths: columns.map((column) => column.width || "auto"),
			body: [
				columns.map((column) => ({
					text: column.header,
					bold: true,
					fillColor: "black",
					color: "white",
				})),
				...rows.map((row, rowIndex) =>
					columns.map((column) => {
						const value = column.getValue(row, rowIndex)
						return (value || column.emptyValue) ?? defaultEmptyValue
					})
				),
			],
		},
	}
}

export default pdfMakeInstance
