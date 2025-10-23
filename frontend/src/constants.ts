export const COLORES = [
	{ hex: "#BAFFC9", rgb: "186, 255, 201" },
	{ hex: "#BAE1FF", rgb: "186, 225, 255" },
	{ hex: "#FFFFBA", rgb: "255, 255, 186" },
	{ hex: "#E2BAFF", rgb: "226, 186, 255" },
	{ hex: "#FFE4BA", rgb: "255, 228, 186" },
]

export const COLORES_GRAFICOS = ["#7eb0d5", "#b2e061", "#bd7ebe", "#ffb55a", "#ffee65", "#beb9db", "#fdcce5", "#8bd3c7", "#fd7f6f"]

export const MESES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const

export const NOTA_DE_CREDITO_TIPOS = [
	{ value: "01", label: "Anulación de la operación" },
	{ value: "02", label: "Anulación por error en el RUC" },
	{ value: "03", label: "Corrección por error en la descripción" },
	{ value: "04", label: "Descuento global" },
	{ value: "05", label: "Descuento por ítem" },
	{ value: "06", label: "Devolución total" },
	{ value: "07", label: "Devolución por ítem" },
	{ value: "08", label: "Bonificación" },
	{ value: "09", label: "Disminución en el valor" },
	{ value: "10", label: "Otros conceptos" },
]
