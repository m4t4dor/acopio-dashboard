import { Input, InputProps, Space, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type InputFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	className?: string
	onChange?: (value: string) => void
	addonBeforeSlot?: React.ReactNode
	addonAfterSlot?: React.ReactNode
	inputProps?: Omit<InputProps, "value" | "onChange">
}

const InputFieldForm = <T extends FieldValues>({
	className,
	name,
	control,
	onChange,
	addonBeforeSlot,
	addonAfterSlot,
	inputProps,
}: InputFieldFormProps<T>) => {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	const mergedInputProps = {
		allowClear: true,
		...inputProps,
	}

	return (
		<div className={`w-full ${className || ''}`}>
			<Space.Compact block>
				{addonBeforeSlot}
				<Input
					ref={field.ref}
					value={field.value}
					onChange={(e) => {
						field.onChange(e.target.value)
						onChange?.(e.target.value)
					}}
					status={error ? "error" : undefined}
					{...mergedInputProps}
				/>
				{addonAfterSlot}
			</Space.Compact>
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default InputFieldForm
