import dayjsInstance from "@/libs/dayjs"
import { DatePicker, DatePickerProps, Space, Typography } from "antd"
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type DatePickerFieldFormProps<T extends FieldValues> = UseControllerProps<T> & {
	className?: string
	onChange?: (value: string | string[]) => void
	addonBeforeSlot?: React.ReactNode
	addonAfterSlot?: React.ReactNode
	datePickerProps?: Omit<DatePickerProps, "value" | "onChange">
}

const DatePickerFieldForm = <T extends FieldValues>({
	className,
	name,
	control,
	onChange,
	addonBeforeSlot,
	addonAfterSlot,
	datePickerProps,
}: DatePickerFieldFormProps<T>) => {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control })

	return (
		<div className={`${className || ''}`}>
			<Space.Compact block>
				{addonBeforeSlot}
				<DatePicker
					ref={field.ref}
					value={field.value ? dayjsInstance(field.value) : undefined}
					onChange={(_, dateString) => {
						field.onChange(dateString)
						onChange?.(dateString)
					}}
					status={error ? "error" : undefined}
					style={{ width: "100%" }}
					getPopupContainer={(trigger) => trigger.parentElement || document.body}
					{...datePickerProps}
				/>
				{addonAfterSlot}
			</Space.Compact>
			<Typography.Text type="danger" style={{ fontSize: 12 }}>
				{error?.message}
			</Typography.Text>
		</div>
	)
}

export default DatePickerFieldForm
