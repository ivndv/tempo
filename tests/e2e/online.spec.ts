// Valida flujo completo online: crear tarea, registrar pomodoro y persistir en la nube
import { expect, test } from "@playwright/test";

test("crear tarea online y registrarla en la nube", async ({ page }) => {
	const nombre = `E2E online ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

	// 1. Carga la página principal
	await page.goto("/");
	await page.getByPlaceholder("Nueva tarea...").fill(nombre);

	// 2. Instala el reloj simulado antes de iniciar el temporizador
	await page.clock.install();
	await page.getByRole("button", { name: "Crear y empezar" }).click();

	await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
	const activa = await page.evaluate(() =>
		localStorage.getItem("pomodoro_active_session"),
	);
	expect(activa).not.toBeNull();

	// 3. Avanza el reloj (26 min) para completar el pomodoro naturalmente
	await page.clock.fastForward("26:00");

	// 4. Confirma la finalización de la tarea en el diálogo de completado
	await expect(page.getByRole("button", { name: "Sí, completada" })).toBeVisible();
	await page.getByRole("button", { name: "Sí, completada" }).click();

	// 5. Confirma registro único de la tarea en la API
	const res = await page.request.get("/api/tareas");
	expect(res.ok()).toBeTruthy();
	const body = JSON.stringify(await res.json());
	expect(body.match(new RegExp(nombre, "g"))).toHaveLength(1);
});
