import { expect, test } from "@playwright/test";

const NOMBRE = `E2E offline ${Date.now()}`;

test("tarea creada sin red se sincroniza al reconectar sin duplicarse", async ({
	page,
}) => {
	// sin red: toda petición a la API aborta
	await page.route("**/api/**", (r) => r.abort());
	await page.goto("/");
	await page.getByPlaceholder("Nueva tarea...").fill(NOMBRE);
	await page.getByRole("button", { name: "Crear y empezar" }).click();
	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();

	// persiste tras recargar sin red
	await page.reload();
	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();

	// reconectar: el sync sube la tarea y no debe duplicarla
	await page.unroute("**/api/**");
	await page.reload();
	await expect(page.getByRole("heading", { name: NOMBRE })).toHaveCount(1);

	// Sync determinista (solución estándar Playwright para offline):
	// syncLocalToCloud expone window.__tempoSyncDone + evento tempo-sync-done
	// Esto es más robusto que solo waitForResponse (puede perderse si el POST ya pasó)
	await page
		.waitForFunction(
			() =>
				(window as unknown as Record<string, unknown>).__tempoSyncDone === true,
			null,
			{
				timeout: 15_000,
			},
		)
		.catch(() => {});
	// Fallback por si el flag no se seteó (navegador sin window): espera al POST
	await page
		.waitForResponse(
			(r) => r.url().includes("/api/tareas") && r.request().method() === "POST",
			{ timeout: 5_000 },
		)
		.catch(() => {});
	await page.waitForLoadState("networkidle").catch(() => {});

	const listarTareas = async (): Promise<string[]> => {
		const res = await page.request.get("/api/tareas");
		if (!res.ok()) return [];
		const body = JSON.stringify(await res.json());
		return body.match(new RegExp(NOMBRE, "g")) ?? [];
	};

	// Poll corto solo para verificar, no para esperar sync (ya esperado arriba)
	await expect
		.poll(listarTareas, { timeout: 10_000, intervals: [500, 1_000, 2_000] })
		.toHaveLength(1);
});
