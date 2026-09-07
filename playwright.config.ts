import { defineConfig } from "@playwright/test";

// Configuración de puertos y claves para pruebas E2E
const TEST_CONFIG = {
	PORTS: {
		APP: 4321,
		RESILIENCE: 4322,
		HASH_SERVICE: 3010,
		UNAVAILABLE_SERVICE: 3999, // Simula servicio de hash caído
	},
	CLOUDFLARE_COMPAT_DATE: "2026-04-30",
	TURNSTILE_TEST_KEY: "1x0000000000000000000000000000000AA",
} as const;

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 45_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: `http://localhost:${TEST_CONFIG.PORTS.APP}`,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		// Setup: inicia sesión y guarda cookies en storageState.json
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		// Suite principal con sesión activa
		{
			name: "e2e",
			testIgnore: /resiliencia\.spec\.ts/,
			dependencies: ["setup"],
			use: { storageState: "tests/e2e/.state/storageState.json" },
		},
		// Resiliencia: evalúa comportamiento ante caída del servicio de hash
		{
			name: "resiliencia",
			testMatch: /resiliencia\.spec\.ts/,
			dependencies: ["setup"],
			use: { baseURL: `http://localhost:${TEST_CONFIG.PORTS.RESILIENCE}` },
		},
		// Vista móvil (390x844)
		{
			name: "mobile",
			testMatch: /online\.spec\.ts/,
			dependencies: ["setup"],
			use: {
				storageState: "tests/e2e/.state/storageState.json",
				viewport: { width: 390, height: 844 },
			},
		},
	],
	webServer: [
		// Stub de hash Argon2id
		{
			command: "bun tests/support/hashy-stub.ts",
			url: `http://localhost:${TEST_CONFIG.PORTS.HASH_SERVICE}/health`,
			timeout: 30_000,
			reuseExistingServer: true,
		},
		// Servidor principal de Pages
		{
			command: `wrangler pages dev dist/ --compatibility-date=${TEST_CONFIG.CLOUDFLARE_COMPAT_DATE} --ip localhost --port ${TEST_CONFIG.PORTS.APP} --binding TURNSTILE_SECRET_KEY=${TEST_CONFIG.TURNSTILE_TEST_KEY}`,
			url: `http://localhost:${TEST_CONFIG.PORTS.APP}/api/auth/get-session`,
			timeout: 90_000,
			reuseExistingServer: false,
		},
		// Servidor secundario con servicio de hash inactivo para pruebas de resiliencia
		{
			command: `wrangler pages dev dist/ --compatibility-date=${TEST_CONFIG.CLOUDFLARE_COMPAT_DATE} --ip localhost --port ${TEST_CONFIG.PORTS.RESILIENCE} --binding TURNSTILE_SECRET_KEY=${TEST_CONFIG.TURNSTILE_TEST_KEY} --binding HASH_SERVICE_URL=http://localhost:${TEST_CONFIG.PORTS.UNAVAILABLE_SERVICE} --binding BETTER_AUTH_URL=http://localhost:${TEST_CONFIG.PORTS.RESILIENCE}`,
			url: `http://localhost:${TEST_CONFIG.PORTS.RESILIENCE}/api/auth/get-session`,
			timeout: 90_000,
			reuseExistingServer: false,
		},
	],
});
