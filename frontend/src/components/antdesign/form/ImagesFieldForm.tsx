import { Button, Image, message, Tooltip, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { useEffect, useRef, useState } from "react"

type TImageFieldValue = {
	currentImage: string | null
	newImage: File | null
}
type TImagesFieldValue = TImageFieldValue[]

type ImagesFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	className?: string
	accept?: string
	maxFiles?: number
}

const ImagesFieldForm = <T extends FieldValues>({
	className,
	name,
	accept = ".png,.jpg,.jpeg",
	maxFiles,
	control,
}: ImagesFieldFormProps<T>) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	const fieldValue = field.value as TImagesFieldValue
	const fieldOnChange = field.onChange as (value: TImagesFieldValue) => void

	const handleOnSelect = () => {
		if (inputRef.current) {
			inputRef.current.click()
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || [])

		const newImages: TImagesFieldValue = files.map((file) => ({
			currentImage: null,
			newImage: file,
		}))

		if (editingIndex != null) {
			const updatedImages = [...fieldValue]
			updatedImages[editingIndex] = newImages[0]
			fieldOnChange(updatedImages)
			setEditingIndex(null)
		} else {
			// validar número máximo de archivos
			const nextValue = [...fieldValue, ...newImages]

			if (maxFiles && nextValue.length > maxFiles) {
				message.warning(`No puedes subir más de ${maxFiles} imágenes.`)
				return
			}

			fieldOnChange([...fieldValue, ...newImages])
		}

		event.target.value = ""
	}

	const handleOnEdit = (idx: number) => {
		setEditingIndex(idx)

		if (inputRef.current) {
			inputRef.current.click()
		}
	}

	const handleOnDelete = (idx: number) => {
		const newValue = fieldValue.filter((_, fieldIdx) => fieldIdx != idx)
		fieldOnChange(newValue)
	}

	return (
		<div className={className}>
			<input ref={inputRef} type="file" hidden accept={accept} onChange={handleInputChange} multiple />
			<ul className="flex flex-wrap gap-2">
				{fieldValue.map((value, idx) => (
					<li key={idx}>
						<ImageItem
							key={idx}
							idx={idx}
							value={value}
							onEdit={() => handleOnEdit(idx)}
							onDelete={() => handleOnDelete(idx)}
						/>
					</li>
				))}
				<li>
					<Button className="aspect-square size-32 flex-col" onClick={handleOnSelect}>
						<PlusOutlined />
						<Typography.Text className="text-xs">Seleccionar</Typography.Text>
					</Button>
				</li>
			</ul>
			<Typography.Text type="danger" className="block mt-1" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

type ImageItemProps = {
	idx: number
	value: TImageFieldValue
	onEdit?: () => void
	onDelete: () => void
}

const ImageItem = ({ value, onEdit, onDelete }: ImageItemProps) => {
	const [previewImage, setPreviewImage] = useState<string | null>(null)

	useEffect(() => {
		setPreviewImage(value.newImage ? URL.createObjectURL(value.newImage) : value.currentImage || null)
	}, [value])

	return (
		<div className="aspect-square size-32 relative p-1 border border-dashed rounded">
			<Image wrapperClassName="size-full" className="size-full object-contain rounded" src={previewImage!} />
			<div className="absolute top-2 right-2 flex flex-col gap-1">
				<Tooltip title="Editar imagen">
					<Button size="small" icon={<EditOutlined />} type="primary" onClick={onEdit} />
				</Tooltip>
				<Tooltip title="Eliminar imagen">
					<Button size="small" icon={<DeleteOutlined />} type="primary" danger onClick={onDelete} />
				</Tooltip>
			</div>
		</div>
	)
}

export default ImagesFieldForm
