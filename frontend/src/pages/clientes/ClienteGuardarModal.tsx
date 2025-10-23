import ResponsiveModal from "@/components/ResponsiveModal"
import ClienteForm from "./ClienteForm"
import { TCliente } from "@/types"

type ClienteGuardarModalProps = {
	recordId?: number
	onClose: () => void
	onSaved?: (cliente: TCliente) => void
}

const ClienteGuardarModal = ({ recordId, onClose, onSaved }: ClienteGuardarModalProps) => {
	const isEditMode = recordId != undefined

	const handleSaved = (cliente: TCliente) => {
		onSaved?.(cliente)
		onClose()
	}

	return (
		<ResponsiveModal 
			open={true} 
			onCancel={onClose} 
			title={isEditMode ? "Editar cliente" : "Crear cliente"} 
			footer={null} 
			width={800}
			mobileFullScreen={true}
		>
			<ClienteForm recordId={recordId} onSaved={handleSaved} />
		</ResponsiveModal>
	)
}

export default ClienteGuardarModal
