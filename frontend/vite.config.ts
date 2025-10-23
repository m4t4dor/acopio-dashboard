import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd())
	return {
		plugins: [react()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
		},
		base: env.VITE_APP_BASE_URL,
		css: {
			preprocessorOptions: {
				scss: {
					quietDeps: true, // Silencia las advertencias de dependencias como "legacy-js-api"
				},
			},
		},
	}
})
