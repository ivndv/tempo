// Pruebas unitarias con jsdom para emular el DOM en componentes y hooks
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		include: ["tests/unit/**/*.spec.ts"],
	},
});
