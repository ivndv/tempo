import type { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "../../src/lib/auth";
import { checkRateLimit } from "./_helpers";
import type { Bindings } from "./_helpers";

// Catch-all para Better Auth: aplica rate limiting por IP y delega a Better Auth
export function registerAuth(app: OpenAPIHono<{ Bindings: Bindings }>) {
	app.all("*", async (c) => {
		// 1. Verifica si la ruta es de login o signup para aplicar rate limiting
		const path = c.req.path;
		if (path.includes("/sign-in/email") || path.includes("/sign-up/email")) {
			const kv = c.env.LUCIA_KV;
			if (kv) {
				// 2. Extrae la IP del cliente desde el header de Cloudflare
				const ip = c.req.header("cf-connecting-ip") || "unknown";
				// 3. Verifica si la IP excedió el límite de intentos permitidos
				const allowed = await checkRateLimit(kv, ip);
				// 4. Si excedió el límite, responde con 429 en el idioma del cliente
				if (!allowed) {
					const lang = c.req.header("Accept-Language")?.startsWith("en")
						? "en"
						: "es";
					return c.json(
						{
							error:
								lang === "es"
									? "Demasiados intentos. Intente de nuevo en 5 minutos."
									: "Too many attempts. Please try again in 5 minutes.",
						},
						429,
					);
				}
			}
		}

		// 5. Obtiene el token de Turnstile del header de la request
		const turnstileToken = c.req.header("x-turnstile-token");
		// 6. Inicializa la instancia de Better Auth con las bindings de Cloudflare
		const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);

		// 7. Reconstruye la request con el token de Turnstile si existe
		let requestHandler = c.req.raw;
		if (turnstileToken) {
			const headers = new Headers(c.req.raw.headers);
			if (!headers.has("x-turnstile-token")) {
				headers.set("x-turnstile-token", turnstileToken);
			}
			requestHandler = new Request(c.req.raw, { headers });
		}

		// 8. Delega la autenticación a Better Auth
		return authInstance.handler(requestHandler);
	});
}
