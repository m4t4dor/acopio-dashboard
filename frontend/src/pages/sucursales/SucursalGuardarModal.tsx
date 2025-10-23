import ResponsiveModal from "@/components/ResponsiveModal"
import SucursalForm from "./SucursalForm"

type SucursalGuardarModalProps = {
	recordId?: number
	onClose: () => void
	onSaved?: () => void
}

const SucursalGuardarModal = ({ recordId, onClose, onSaved }: SucursalGuardarModalProps) => {
	const isEditMode = recordId != undefined

	return (
		<ResponsiveModal 
			open={true} 
			onCancel={onClose} 
			title={isEditMode ? "Editar sucursal" : "Crear sucursal"} 
			footer={null}
			width={600}
			mobileFullScreen={true}
		>
			<SucursalForm recordId={recordId} onSaved={onSaved} />
		</ResponsiveModal>
	)
}

export default SucursalGuardarModal
