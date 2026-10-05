import type { OpenAPIHono } from "@hono/zod-openapi";
// Sesión (para limitar por usuario cuando está autenticado)
import { getSession } from "../_shared/helpers";
// Rate limit (policy y store D1)
import {
	construirClaveInterna,
	elegirIdentificador,
	esRutaExenta,
	resolverReglaInterna,
} from "../_shared/rate-limit/rules";
import { crearStoreD1 } from "../_shared/rate-limit/store.d1";
// Tipos
import type { Bindings } from "../_shared/types";

// Registra el rate limiting propio (usuario autenticado o IP) para los endpoints internos
export function registerRateLimit(app: OpenAPIHono<{ Bindings: Bindings }>) {
	app.use("*", async (c, next) => {
		// 1. Exime el flujo nativo de Better Auth, el health y el preflight
		if (esRutaExenta(c.req.path, c.req.method)) return next();

		// 2. Resuelve la IP del cliente (Cloudflare primero, luego proxy)
		const ip =
			c.req.header("cf-connecting-ip") ||
			c.req.header("x-forwarded-for") ||
			"unknown";

		// 3. Intenta resolver la sesión: si hay usuario, se limita por usuario
		let userId: string | undefined;
		try {
			const sesion = await getSession(c);
			userId = sesion?.user.id;
		} catch {
			// Si falla la sesión, se cae a limitar por IP
		}

		// 4. Consume una petición contra la regla interna usando usuario o IP
		const regla = resolverReglaInterna(c.env.RATE_LIMIT_MAX_INTERNAL);
		const store = crearStoreD1(c.env.DB);
		const resultado = await store.consume(
			construirClaveInterna(elegirIdentificador(userId, ip), c.req.path),
			regla,
		);

		// 5. Expone los headers de rate limiting estándar
		c.header("RateLimit-Limit", String(resultado.limit));
		c.header("RateLimit-Remaining", String(resultado.remaining));
		c.header("RateLimit-Reset", String(resultado.retryAfter));

		// 6. Bloquea con 429 si excedió el límite
		if (!resultado.allowed) {
			c.header("Retry-After", String(resultado.retryAfter));
			return c.json(
				{ error: "Demasiadas peticiones. Intente de nuevo en unos minutos." },
				429,
			);
		}

		return next();
	});
}
