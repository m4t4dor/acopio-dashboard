import ResponsiveModal from "@/components/ResponsiveModal"
import EmpresaForm from "./EmpresaForm"
import { TEmpresa } from "@/types"

type EmpresaGuardarModalProps = {
	recordId?: number
	onClose: () => void
	onSaved?: (empresa: TEmpresa) => void
}

const EmpresaGuardarModal = ({ recordId, onClose, onSaved }: EmpresaGuardarModalProps) => {
	const isEditMode = recordId != undefined

	const handleSaved = (empresa: TEmpresa) => {
		onSaved?.(empresa)
		onClose()
	}

	return (
		<ResponsiveModal 
			open={true} 
			onCancel={onClose} 
			title={isEditMode ? "Editar empresa" : "Crear empresa"} 
			footer={null} 
			width={800}
			mobileFullScreen={true}
		>
			<EmpresaForm recordId={recordId} onSaved={handleSaved} />
		</ResponsiveModal>
	)
}

export default EmpresaGuardarModal
