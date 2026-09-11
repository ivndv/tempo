import { defineConfig } from "@playwright/test";

// Configuración de puertos y claves para pruebas de humo
const SMOKE_CONFIG = {
	PORT: Number(process.env.TEST_PORT || 4321),
	CLOUDFLARE_COMPAT_DATE: "2026-04-30",
	TURNSTILE_TEST_KEY: "1x0000000000000000000000000000000AA",
} as const;

export default defineConfig({
	testDir: "./tests/smoke",
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: `http://localhost:${SMOKE_CONFIG.PORT}`,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "smoke", testMatch: /smoke\.spec\.ts/ }],
	webServer: [
		{
			command: `wrangler pages dev dist/ --compatibility-date=${SMOKE_CONFIG.CLOUDFLARE_COMPAT_DATE} --ip localhost --port ${SMOKE_CONFIG.PORT} --binding TURNSTILE_SECRET_KEY=${SMOKE_CONFIG.TURNSTILE_TEST_KEY}`,
			url: `http://localhost:${SMOKE_CONFIG.PORT}/api/auth/get-session`,
			timeout: 60_000,
			reuseExistingServer: false,
		},
	],
});
