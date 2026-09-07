// Valida cambio dinámico de idioma (español e inglés)
import { expect, test } from "@playwright/test";

test("el bloque de tareas se renderiza en español e inglés", async ({
	page,
}) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Tareas pendientes" }),
	).toBeVisible();

	// Cambia idioma a inglés desde el selector
	await page.getByRole("button", { name: "Change language" }).click();
	await page.getByRole("menuitem", { name: "English" }).click();

	await expect(
		page.getByRole("heading", { name: "Pending Tasks" }),
	).toBeVisible();
});
