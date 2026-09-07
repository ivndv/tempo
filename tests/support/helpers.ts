import { expect, type Page } from "@playwright/test";

// Token simulado de Turnstile para tests automatizados
export const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

// Mock de Turnstile para navegadores headless
export async function mockTurnstile(page: Page) {
	await page.route("**/challenges.cloudflare.com/**", (route) =>
		route.fulfill({
			contentType: "application/javascript",
			body: `window.turnstile = {
				render: (_el, opts) => {
					setTimeout(() => opts.callback && opts.callback("${DUMMY_TOKEN}"), 0);
					return "dummy-widget";
				},
				remove: () => {},
				reset: () => {},
				getResponse: () => "${DUMMY_TOKEN}",
			};`,
		}),
	);
}

// Flujo de login en la interfaz web
export async function login(page: Page, email: string, password: string) {
	await mockTurnstile(page);
	await page.goto("/login");
	await page.getByPlaceholder("ejemplo@correo.com").fill(email);
	await page.getByPlaceholder("••••••••").fill(password);
	await page.waitForTimeout(100);
	await page.getByRole("button", { name: "Entrar" }).click();
}

// Valida redirección exitosa al dashboard
export async function expectLoginExitoso(page: Page) {
	await expect(page).toHaveURL(/localhost:4321\/(es\/)?$/, { timeout: 15_000 });
}

// Configura el tema antes de la navegación para evitar FOUC y asincronías
export async function prepararTema(page: Page, tema: "business" | "nord") {
	await page.addInitScript((t) => {
		try {
			localStorage.setItem("theme", t);
		} catch {}
	}, tema);
}

// Establece el tema en el DOM y localStorage para pruebas visuales
export async function setTema(page: Page, tema: "business" | "nord") {
	await page.evaluate((theme) => {
		document.documentElement.setAttribute("data-theme", theme);
		document.documentElement.classList.toggle("dark", theme === "business");
		try {
			localStorage.setItem("theme", theme);
		} catch {}
	}, tema);
	// Espera breve para estabilizar transiciones CSS de color
	await page.waitForTimeout(200);
}
