import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { auth } from "../../src/lib/server/auth";
import { checkRateLimit } from "../_shared/helpers";
import type { Bindings } from "../_shared/types";

// Respuesta 429 con mensaje en el idioma del cliente
const tooManyRequests = (c: Context<{ Bindings: Bindings }>) =>
	c.json(
		{ error: "Demasiados intentos. Intente de nuevo en unos minutos." },
		429,
	);

// Catch-all para Better Auth: aplica rate limiting por IP y delega a Better Auth
export function registerAuth(app: OpenAPIHono<{ Bindings: Bindings }>) {
	app.all("*", async (c) => {
		// 1. Aplica rate limiting a las rutas sensibles
		const path = c.req.path;
		const ip = c.req.header("cf-connecting-ip") || "unknown";
		const kv = c.env.LUCIA_KV;
		const esRateLimited =
			kv &&
			(((path.includes("/sign-in/email") || path.includes("/sign-up/email")) &&
				!(await checkRateLimit(kv, ip, 20, 5, "login"))) ||
				(path.includes("/request-password-reset") &&
					!(await checkRateLimit(kv, ip, 5, 60, "forgot-password"))));

		// 2. Si excedió el límite, responde con 429
		if (esRateLimited) {
			return tooManyRequests(c);
		}

		// 3. Delega la autenticación a Better Auth
		const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);
		return authInstance.handler(c.req.raw);
	});
}
