import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.scss"
import { BrowserRouter } from "react-router-dom"
import Providers from "./Providers.tsx"

createRoot(document.getElementById("root")!).render(
	<BrowserRouter basename={import.meta.env?.VITE_APP_BASE_URL || "/"}>
		<Providers>
			<App />
		</Providers>
	</BrowserRouter>
)
