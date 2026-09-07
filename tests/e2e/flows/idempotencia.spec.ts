// Valida que recargas repetidas no dupliquen peticiones ni registros
import { expect, test } from "@playwright/test";

test("recargar con sesión no re-sube ni duplica datos", async ({ page }) => {
	// Monitorea llamadas POST salientes
	const posts: string[] = [];
	page.on("request", (r) => {
		if (r.method() === "POST") posts.push(r.url());
	});

	await page.goto("/");
	for (let i = 0; i < 3; i++) await page.reload();

	// Verifica que no se hayan disparado mutaciones accidentales
	expect(posts.filter((u) => u.includes("/api/tareas"))).toHaveLength(0);
	expect(posts.filter((u) => u.includes("/api/pomodoros"))).toHaveLength(0);

	// Tareas pendientes del seed sin duplicados
	await expect(
		page.getByRole("button", { name: "Iniciar enfoque" }),
	).toHaveCount(2);
});
