// Integraciones
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

// Configuración de Astro
export default defineConfig({
	// Modo estático (sin servidor)
	output: "static",
	site: "https://tempo.mgdc.site",
	prefetch: true,
	integrations: [react(), sitemap(), icon()],

	// Vite + Tailwind CSS
	vite: {
		plugins: [tailwindcss()],
		ssr: { external: [] },
		server: {
			watch: { ignored: ["**/.wrangler/**"] },
		},
	},

	// i18n: español por defecto, inglés con prefijo /en/
	i18n: {
		defaultLocale: "es",
		locales: ["es", "en"],
		routing: { prefixDefaultLocale: false },
	},
});
