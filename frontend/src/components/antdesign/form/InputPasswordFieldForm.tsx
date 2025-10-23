import { Input, InputProps, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type InputPasswordFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	onChange?: (value: string) => void
	inputProps?: Omit<InputProps, "value" | "onChange">
}

const InputPasswordFieldForm = <T extends FieldValues>({ name, control, onChange, inputProps }: InputPasswordFieldFormProps<T>) => {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	return (
		<div>
			<Input.Password
				ref={field.ref}
				value={field.value}
				onChange={(e) => {
					field.onChange(e.target.value)
					onChange?.(e.target.value)
				}}
				status={error ? "error" : undefined}
				{...inputProps}
			/>
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default InputPasswordFieldForm
