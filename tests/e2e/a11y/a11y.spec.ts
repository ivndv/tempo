// Auditoría de accesibilidad WCAG 2.1 AA con axe-core en temas claro y oscuro
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { mockTurnstile, prepararTema, setTema } from "../../support/helpers";

// Espera a que finalicen la red y las animaciones CSS (fadeInUp 0.6s)
async function waitForStableA11y(page: Page) {
	await page.waitForLoadState("networkidle").catch(() => {});
	await page.waitForTimeout(650);
}

test.describe("accesibilidad wcag 2.1 aa", () => {
	// ─── LOGIN (sin sesión) ──────────────────────────────────
	test.describe("login sin sesión", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("login - modo oscuro", async ({ page }) => {
			await mockTurnstile(page);
			await prepararTema(page, "business");
			await page.goto("/login");
			await setTema(page, "business");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});

		test("login - modo claro", async ({ page }) => {
			await mockTurnstile(page);
			await prepararTema(page, "nord");
			await page.goto("/login");
			await setTema(page, "nord");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});
	});

	// ─── DASHBOARD (con sesión) ──────────────────────────────
	test.describe("dashboard", () => {
		test("dashboard - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/");
			await setTema(page, "business");
			await page.getByRole("button", { name: /salir/i }).waitFor();
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});

		test("dashboard - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/");
			await setTema(page, "nord");
			await page.getByRole("button", { name: /salir/i }).waitFor();
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});
	});

	// ─── ACERCA DE (/about) ──────────────────────────────────
	test.describe("acerca de", () => {
		test("about - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/about");
			await setTema(page, "business");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});

		test("about - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/about");
			await setTema(page, "nord");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});
	});

	// ─── BLOG (/blog) ────────────────────────────────────────
	test.describe("blog", () => {
		test("blog - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/blog");
			await setTema(page, "business");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});

		test("blog - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/blog");
			await setTema(page, "nord");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});
	});

	// ─── 404 (/404) ──────────────────────────────────────────
	test.describe("404", () => {
		test("404 - modo oscuro", async ({ page }) => {
			await prepararTema(page, "business");
			await page.goto("/404");
			await setTema(page, "business");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});

		test("404 - modo claro", async ({ page }) => {
			await prepararTema(page, "nord");
			await page.goto("/404");
			await setTema(page, "nord");
			await waitForStableA11y(page);

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa"])
				.analyze();

			expect(results.violations).toEqual([]);
		});
	});
});
