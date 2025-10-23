import CustomBreadcrumb from "@/components/antdesign/CustomBreadcrumb"
import { Card } from "antd"
import CambiarContraseniaForm from "./CambiarContraseniaForm"

const CambiarContraseniaPage = () => {
	return (
		<>
			<CustomBreadcrumb
				links={[
					{
						label: "Cambiar contraseña",
					},
				]}
			/>
			<Card className="mt-4" title="Cambiar contraseña">
				<CambiarContraseniaForm />
			</Card>
		</>
	)
}

export default CambiarContraseniaPage
