import React from "react"
import { Link } from "react-router-dom"
import { Breadcrumb } from "antd"
import { HomeOutlined } from "@ant-design/icons"

type Props = {
	links: {
		label: React.ReactNode
		to?: string
	}[]
}

const CustomBreadcrumb = ({ links }: Props) => {
	const items = [
		{
			title: (
				<Link to="/" className="flex items-center gap-1">
					<HomeOutlined className="text-sm" />
					<span className="hidden sm:inline">Inicio</span>
				</Link>
			),
		},
		...links.map((link) => ({
			title: link.to ? (
				<Link to={link.to} className="text-sm sm:text-base">
					{link.label}
				</Link>
			) : (
				<span className="text-sm sm:text-base">{link.label}</span>
			),
		})),
	]

	return (
		<div className="mb-4 overflow-x-auto">
			<Breadcrumb items={items} className="whitespace-nowrap" />
		</div>
	)
}

export default CustomBreadcrumb