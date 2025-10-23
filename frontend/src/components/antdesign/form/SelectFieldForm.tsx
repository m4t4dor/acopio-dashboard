import { Select, SelectProps, Space, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type TOptions = {
	label: string
	value: string
}

type SelectFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	onChange?: (value: string | string[]) => void
	options: TOptions[]
	addonBeforeSlot?: React.ReactNode
	addonAfterSlot?: React.ReactNode
	selectProps?: Omit<SelectProps, "value" | "onChange">
}

const SelectFieldForm = <T extends FieldValues>({
	name,
	control,
	onChange,
	options,
	addonBeforeSlot,
	addonAfterSlot,
	selectProps,
}: SelectFieldFormProps<T>) => {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	const mergedSelectProps = {
		allowClear: true,
		placeholder: "Seleccione...",
		showSearch: true,
		optionFilterProp: "label" as const,
		styles: {
			popup: {
				root: {
					maxWidth: '95vw',
					zIndex: 9999
				}
			}
		},
		...selectProps,
	}

	return (
		<div id="select-field-form" className="relative w-full">
			<Space.Compact block>
				{addonBeforeSlot}
				<Select
					className="w-full"
					ref={field.ref}
					value={field.value || undefined}
					onChange={(value) => {
						field.onChange(value)
						onChange?.(value)
					}}
					status={error ? "error" : undefined}
					options={options}
					getPopupContainer={(trigger) => trigger.parentElement || document.body}
					{...mergedSelectProps}
				/>
				{addonAfterSlot}
			</Space.Compact>
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default SelectFieldForm
