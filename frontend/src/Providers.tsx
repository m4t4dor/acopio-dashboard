import React from "react"
import { ConfigProvider } from "antd"
import esES from "antd/es/locale/es_ES"
import { StyleProvider } from "@ant-design/cssinjs"

type Props = {
	children: React.ReactNode
}

const Providers = ({ children }: Props) => {
	return (
		<StyleProvider layer>
			<ConfigProvider
				locale={esES}
				theme={{
					token: {
						borderRadius: 4,
						yellow: "#FFBB33",
						yellow1: "#FFBB33",
						yellow2: "#FFBB33",
						yellow3: "#FFBB33",
						yellow4: "#FFBB33",
						yellow5: "#FFBB33",
						yellow6: "#FFBB33",
						yellow7: "#FFBB33",
						yellow8: "#FFBB33",
						yellow9: "#FFBB33",
						yellow10: "#FFBB33",
					},
					components: {
						Input: {
							colorTextDisabled: "rgba(0,0,0,0.5)",
						},
						Select: {
							colorTextDisabled: "rgba(0,0,0,0.5)",
						},
					},
				}}
			>
				{children}
			</ConfigProvider>
		</StyleProvider>
	)
}

export default Providers
