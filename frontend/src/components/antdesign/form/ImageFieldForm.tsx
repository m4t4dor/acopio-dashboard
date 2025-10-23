import { Button, Image, Tooltip, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"
import { EditOutlined, PlusOutlined } from "@ant-design/icons"
import { useEffect, useRef, useState } from "react"

type ImageFieldValue = {
	currentImage: string | null
	newImage: File | null
}

type ImageFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	className?: string
	accept?: string
}

const ImageFieldForm = <T extends FieldValues>({ className, name, accept, control }: ImageFieldFormProps<T>) => {
	const inputRef = useRef<HTMLInputElement>(null)
	const [previewImage, setPreviewImage] = useState<string | null>(null)
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	const fieldValue = field.value as ImageFieldValue
	const fieldOnChange = field.onChange as (value: ImageFieldValue) => void

	const handleOnSelect = () => {
		if (inputRef.current) {
			inputRef.current.click()
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] || null

		fieldOnChange({
			currentImage: fieldValue.currentImage,
			newImage: file,
		})

		setPreviewImage(file ? URL.createObjectURL(file) : null)
	}

	useEffect(() => {
		setPreviewImage(fieldValue.currentImage)
	}, [])

	return (
		<div className={className}>
			<input ref={inputRef} type="file" hidden accept={accept} onChange={handleInputChange} />
			{previewImage ? (
				<div className="aspect-square size-32 relative p-1 border border-dashed rounded">
					<Image wrapperClassName="size-full" className="size-full object-contain rounded" src={previewImage} />
					<div className="absolute top-2 right-2">
						<Tooltip title="Editar imagen">
							<Button size="small" icon={<EditOutlined />} type="primary" onClick={handleOnSelect} />
						</Tooltip>
					</div>
				</div>
			) : (
				<Button className="aspect-square size-32 flex-col" onClick={handleOnSelect}>
					<PlusOutlined />
					<Typography.Text className="text-xs">Seleccionar</Typography.Text>
				</Button>
			)}
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default ImageFieldForm
