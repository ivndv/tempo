import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { DUMMY_TOKEN, login, mockTurnstile } from "../support/helpers";

// Genera JWT de verificación firmado con BETTER_AUTH_SECRET local
function firmarTokenVerificacion(email: string): string {
	const raw = readFileSync(".dev.vars", "utf8");
	const match = raw.match(/^BETTER_AUTH_SECRET=(.+)$/m);
	if (!match) throw new Error("BETTER_AUTH_SECRET no encontrado en .dev.vars");
	const secret = match[1].trim().replace(/^"|"$/g, "");

	const b64url = (input: string) => Buffer.from(input).toString("base64url");
	const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const now = Math.floor(Date.now() / 1000);
	const payload = b64url(JSON.stringify({ email, iat: now, exp: now + 3600 }));
	const signature = createHmac("sha256", secret)
		.update(`${header}.${payload}`)
		.digest("base64url");
	return `${header}.${payload}.${signature}`;
}

// Obtiene el token de reset-password generado en D1
function leerTokenResetDeD1(): string {
	const cmd = `bunx wrangler d1 execute pomodoro-db --local --json --command "SELECT identifier FROM verification WHERE identifier LIKE 'reset-password:%' ORDER BY expiresAt DESC LIMIT 1"`;
	const out = execSync(cmd, { encoding: "utf8", timeout: 30_000 });
	const match = out.match(/\[[\s\S]*\]/);
	if (!match)
		throw new Error(`No se pudo parsear la salida de wrangler d1: ${out}`);
	const statements = JSON.parse(match[0]);
	const row = statements?.[0]?.results?.[0];
	expect(
		row?.identifier,
		"el token de reset debe existir en la tabla verification",
	).toBeTruthy();
	return row.identifier.replace("reset-password:", "");
}

test.describe("render de páginas", () => {
	const paginas: Array<[string, string]> = [
		["/", "dashboard"],
		["/login", "formulario de login"],
		["/forgot-password", "recuperar contraseña"],
		["/about", "acerca de"],
		["/blog", "blog"],
		["/en", "inglés"],
	];

	for (const [ruta, descripcion] of paginas) {
		test(`carga ${descripcion} (${ruta})`, async ({ page }) => {
			const errores: string[] = [];
			page.on("requestfailed", (req) => errores.push(req.url()));

			const res = await page.goto(ruta);
			expect(res?.status(), `${ruta} debe responder 200`).toBe(200);
			await expect(page.locator("body")).toBeVisible();

			expect(
				errores.filter((u) => !u.includes("challenges.cloudflare.com")),
				"no debe haber requests fallidos",
			).toEqual([]);
		});
	}

	test("ruta inexistente → página 404 del sitio (no un error del server)", async ({
		page,
	}) => {
		const res = await page.goto("/ruta-que-no-existe");
		expect(res?.status(), "la página 404 debe responder con status 404").toBe(
			404,
		);
		await expect(page).toHaveTitle(/404|no encontrado|not found/i);
	});
});

test.describe("flujo real de registro y verificación", () => {
	const password = "Smoke!Pass2026";

	test("registro → email sin verificar bloquea login → verify-email → sesión → crear tarea", async ({
		page,
		request,
	}) => {
		const email = `smoke-${Date.now()}@tempo.dev`;
		const nombreTarea = `Tarea Smoke ${Date.now()}`;

		// 1. Registro con contraseña real (se hashea con hashy: argon2)
		const resSignup = await request.post("/api/auth/sign-up/email", {
			data: { email, password, name: "Smoke Tester" },
			headers: { "x-captcha-response": DUMMY_TOKEN },
		});
		expect(resSignup.status(), "sign-up debe ser 200").toBe(200);
		expect((await resSignup.json()).user.email).toBe(email);

		// 2. Login sin verificar → 403 EMAIL_NOT_VERIFIED (verificación de contraseña real contra hashy)
		const resSignin = await request.post("/api/auth/sign-in/email", {
			data: { email, password },
			headers: { "x-captcha-response": DUMMY_TOKEN },
		});
		expect(resSignin.status()).toBe(403);
		expect((await resSignin.json()).code).toBe("EMAIL_NOT_VERIFIED");

		// 3. Aún sin sesión (get-session sin sesión devuelve `null` literal)
		const sinSesion = await request.get("/api/auth/get-session");
		expect(await sinSesion.json()).toBeNull();

		// 4. El email de verificación llevaría un JWT firmado con BETTER_AUTH_SECRET:
		//    lo firmamos nosotros (stateless en v1.6, no se persiste en D1)
		const token = firmarTokenVerificacion(email);

		// 5. Verificar el email → autoSignInAfterVerification crea la sesión
		await mockTurnstile(page);
		await page.goto(
			`/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent("/")}`,
		);

		// 6. Sesión activa con el usuario nuevo
		const conSesion = await page.request.get("/api/auth/get-session");
		const sesion = await conSesion.json();
		expect(sesion.user.email).toBe(email);

		// 7. Crear una tarea en el dashboard
		await page.goto("/");
		await page.getByPlaceholder("Nueva tarea...").fill(nombreTarea);
		await page.getByRole("button", { name: "Crear y empezar" }).click();
		await expect(page.getByText(nombreTarea)).toBeVisible();
	});

	test("forgot-password → token de reset → nueva contraseña → login (hashy real)", async ({
		page,
		request,
		browser,
	}) => {
		const email = `reset-${Date.now()}@tempo.dev`;

		// Setup: usuario verificado vía API (sign-up + verify)
		const resSignup = await request.post("/api/auth/sign-up/email", {
			data: { email, password, name: "Reset Tester" },
			headers: { "x-captcha-response": DUMMY_TOKEN },
		});
		expect(resSignup.status()).toBe(200);
		await mockTurnstile(page);
		await page.goto(
			`/api/auth/verify-email?token=${encodeURIComponent(firmarTokenVerificacion(email))}&callbackURL=${encodeURIComponent("/")}`,
		);
		const sesion = await (
			await page.request.get("/api/auth/get-session")
		).json();
		expect(sesion.user.email, "el setup debe quedar con sesión").toBe(email);

		// 1. Solicitar restablecimiento (equivale al formulario de forgot-password;
		//    en Better Auth v1.6 la ruta se llama request-password-reset)
		const resForget = await request.post("/api/auth/request-password-reset", {
			data: { email },
			headers: { "x-captcha-response": DUMMY_TOKEN },
		});
		expect(resForget.status()).toBe(200);

		// 2. Token de reset persistido en D1 (identifier `reset-password:<token>`)
		const tokenReset = leerTokenResetDeD1();
		const nuevaPassword = "Reset!Pass2026";

		// 3. UI de reset: /reset-password?token=... → nueva contraseña
		await page.goto(`/reset-password?token=${encodeURIComponent(tokenReset)}`);
		await page.locator('input[type="password"]').nth(0).fill(nuevaPassword);
		await page.locator('input[type="password"]').nth(1).fill(nuevaPassword);
		await page.getByRole("button", { name: "Cambiar contraseña" }).click();
		await expect(page.getByText("✅")).toBeVisible();

		// 4. Contexto de navegador fresco (sin la sesión del setup) para probar
		//    el login real con la contraseña nueva (verificación argon2 contra hashy)
		const ctx = await browser.newContext();
		const pageLogin = await ctx.newPage();
		await login(pageLogin, email, nuevaPassword);
		await expect(pageLogin.getByRole("button", { name: /salir/i })).toBeVisible(
			{
				timeout: 15_000,
			},
		);
		await expect(pageLogin.getByPlaceholder("Nueva tarea...")).toBeVisible();
		await ctx.close();
	});
});
