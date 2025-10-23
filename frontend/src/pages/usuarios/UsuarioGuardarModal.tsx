import ResponsiveModal from "@/components/ResponsiveModal"
import UsuarioForm from "./UsuarioForm"

type UsuarioGuardarModalProps = {
	recordId?: number
	onClose: () => void
	onSaved?: () => void
}

const UsuarioGuardarModal = ({ recordId, onClose, onSaved }: UsuarioGuardarModalProps) => {
	const isEditMode = recordId != undefined

	return (
		<ResponsiveModal 
			open={true} 
			onCancel={onClose} 
			title={isEditMode ? "Editar usuario" : "Crear usuario"} 
			footer={null}
			width={600}
			mobileFullScreen={true}
		>
			<UsuarioForm recordId={recordId} onSaved={onSaved} />
		</ResponsiveModal>
	)
}

export default UsuarioGuardarModal
