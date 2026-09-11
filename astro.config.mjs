// Integraciones
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Configuración de Astro
export default defineConfig({
	// Modo estático (sin servidor)
	output: "static",
	site: "https://tempo.mgdc.site",
	// Preserva el whitespace del output de Astro 6 (default de v7 es 'jsx')
	compressHTML: true,
	prefetch: true,
	integrations: [react(), sitemap()],

	// Vite + Tailwind CSS
	vite: {
		plugins: [
			tailwindcss(),
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
				emitTsDeclarations: true,
				strategy: ["url", "globalVariable", "baseLocale"],
				urlPatterns: [
					{
						pattern: "/:path(.*)?",
						localized: [
							["en", "/en/:path(.*)?"],
							["es", "/:path(.*)?"],
						],
					},
				],
			}),
		],
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
