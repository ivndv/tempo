// Valida respuesta amigable cuando el microservicio de hashing está caído
import { expect, test } from "@playwright/test";
import { login } from "../../support/helpers";

test("el login falla limpio cuando el servicio de hash no responde", async ({
	page,
}) => {
	await login(page, "e2e@tempo.dev", "TestE2E!pass2026");

	// Valida mensaje de error sin romper la interfaz
	await expect(
		page.getByText(/Ocurrió un error|Servicio de autenticación no disponible/),
	).toBeVisible();
	await expect(page).toHaveURL(/login/);
});
