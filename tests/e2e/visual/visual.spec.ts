// Pruebas de regresión visual sobre vistas completas y componentes en modo claro y oscuro
import { expect, type Page, test } from "@playwright/test";
import { mockTurnstile, prepararTema, setTema } from "../../support/helpers";

// Espera a que carguen fuentes y finalice la red
async function waitForStablePage(page: Page) {
	await page.waitForLoadState("networkidle").catch(() => {});
	await page.waitForTimeout(400);
}

test.describe("visual regression", () => {
	// ─── LOGIN (sin sesión) ──────────────────────────────────
	test.describe("login", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("login - modo oscuro", async ({ page }) => {
			await mockTurnstile(page);
			await prepararTema(page, "business");
			await page.goto("/login");
			await setTema(page, "business");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("login-dark.png", {
				animations: "disabled",
			});
		});

		test("login - modo claro", async ({ page }) => {
			await mockTurnstile(page);
			await prepararTema(page, "nord");
			await page.goto("/login");
			await setTema(page, "nord");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("login-light.png", {
				animations: "disabled",
			});
		});
	});

	// ─── COMPONENTES ESTRUCTURALES (HEADER & FOOTER) ─────────
	test.describe("header y footer", () => {
		test("header - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/");
			await setTema(page, "business");
			await waitForStablePage(page);
			await expect(page.locator("header")).toHaveScreenshot("header-dark.png", {
				animations: "disabled",
			});
		});

		test("header - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/");
			await setTema(page, "nord");
			await waitForStablePage(page);
			await expect(page.locator("header")).toHaveScreenshot(
				"header-light.png",
				{
					animations: "disabled",
				},
			);
		});

		test("footer - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/");
			await setTema(page, "business");
			await waitForStablePage(page);
			await expect(page.locator("footer")).toHaveScreenshot("footer-dark.png", {
				animations: "disabled",
			});
		});

		test("footer - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/");
			await setTema(page, "nord");
			await waitForStablePage(page);
			await expect(page.locator("footer")).toHaveScreenshot(
				"footer-light.png",
				{
					animations: "disabled",
				},
			);
		});
	});

	// ─── DASHBOARD (HERO) ────────────────────────────────────
	test.describe("dashboard", () => {
		test("hero - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/");
			await setTema(page, "business");
			await page.getByRole("button", { name: /salir/i }).waitFor();
			await waitForStablePage(page);
			await expect(page.getByTestId("hero")).toHaveScreenshot("hero-dark.png", {
				animations: "disabled",
			});
		});

		test("hero - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/");
			await setTema(page, "nord");
			await page.getByRole("button", { name: /salir/i }).waitFor();
			await waitForStablePage(page);
			await expect(page.getByTestId("hero")).toHaveScreenshot(
				"hero-light.png",
				{
					animations: "disabled",
				},
			);
		});
	});

	// ─── ACERCA DE (/about) ──────────────────────────────────
	test.describe("acerca de", () => {
		test("acerca de - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/about");
			await setTema(page, "business");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("about-dark.png", {
				animations: "disabled",
			});
		});

		test("acerca de - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/about");
			await setTema(page, "nord");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("about-light.png", {
				animations: "disabled",
			});
		});
	});

	// ─── BLOG (/blog) ────────────────────────────────────────
	test.describe("blog", () => {
		test("blog - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/blog");
			await setTema(page, "business");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("blog-dark.png", {
				animations: "disabled",
			});
		});

		test("blog - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/blog");
			await setTema(page, "nord");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("blog-light.png", {
				animations: "disabled",
			});
		});
	});

	// ─── 404 (/404) ──────────────────────────────────────────
	test.describe("404", () => {
		test("404 - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/404");
			await setTema(page, "business");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("404-dark.png", {
				animations: "disabled",
			});
		});

		test("404 - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/404");
			await setTema(page, "nord");
			await waitForStablePage(page);
			await expect(page).toHaveScreenshot("404-light.png", {
				animations: "disabled",
			});
		});
	});
});
