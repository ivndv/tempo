import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	output: "static",
	site: "https://tempo.mgdc.site",
	prefetch: true,
	integrations: [react(), sitemap(), icon()],

	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: [],
		},
		server: {
			watch: {
				ignored: ["**/.wrangler/**"],
			},
		},
	},

	i18n: {
		defaultLocale: "es",
		locales: ["es", "en"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
