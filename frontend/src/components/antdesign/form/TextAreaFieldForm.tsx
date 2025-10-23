import { Input, Typography } from "antd"
import { TextAreaProps } from "antd/es/input"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type TextAreaFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	onChange?: (value: string) => void
	textAreaProps?: Omit<TextAreaProps, "value" | "onChange">
}

const TextAreaFieldForm = <T extends FieldValues>({ name, control, onChange, textAreaProps }: TextAreaFieldFormProps<T>) => {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	const mergedTextAreaProps = {
		autoSize: { minRows: 2, maxRows: 6 },
		...textAreaProps,
	}

	return (
		<div className="w-full">
			<Input.TextArea
				ref={field.ref}
				value={field.value}
				onChange={(e) => {
					field.onChange(e.target.value)
					onChange?.(e.target.value)
				}}
				status={error ? "error" : undefined}
				{...mergedTextAreaProps}
			/>
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default TextAreaFieldForm
