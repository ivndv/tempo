import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { z } from "@hono/zod-openapi";
import { auth } from "../../src/lib/auth";

// Bindings de Cloudflare: variables de entorno, D1, KV
export type Bindings = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TURNSTILE_SECRET_KEY: string;
	HASH_SERVICE_URL: string;
	HASH_SERVICE_API_KEY: string;
	RESEND_API_KEY: string;
	RESEND_FROM?: string;
};

// Schema base para respuestas de error (string o detalle)
export const errorSchema = z.object({
	error: z.union([z.string(), z.record(z.any())]),
});

// Schema base para respuestas exitosas simples
export const successSchema = z.object({ success: z.literal(true) });

// Envuelve un schema de datos en { data: schema } para respuestas REST
export function dataResponse<T extends z.ZodType>(schema: T, name: string) {
	return z.object({ data: schema }).openapi(name);
}

// Controla intentos de login por IP usando KV (20 intentos / 5 min)
export const checkRateLimit = async (
	kv: KVNamespace,
	ip: string,
	maxAttempts = 20,
	windowMinutes = 5,
) => {
	// 1. Construye la clave en KV con la IP como identificador
	const key = `rate-limit:login:${ip}`;
	const now = Date.now();
	// 2. Obtiene el registro actual de intentos desde KV
	const data = await kv.get<{ attempts: number; resetAt: number }>(key, "json");

	// 3. Si no hay registro o la ventana expiró, reinicia el contador
	if (!data || now > data.resetAt) {
		await kv.put(
			key,
			JSON.stringify({ attempts: 1, resetAt: now + windowMinutes * 60 * 1000 }),
			{ expirationTtl: windowMinutes * 60 },
		);
		return true;
	}

	// 4. Si superó el máximo de intentos, bloquea la IP
	if (data.attempts >= maxAttempts) return false;

	// 5. Incrementa el contador dentro de la ventana vigente
	await kv.put(
		key,
		JSON.stringify({ attempts: data.attempts + 1, resetAt: data.resetAt }),
		{ expirationTtl: Math.ceil((data.resetAt - now) / 1000) },
	);
	return true;
};

// Obtiene la sesión actual de Better Auth desde los headers de la request
export const getSession = async (c: {
	env: Bindings;
	req: { raw: { headers: Headers } };
}) => {
	return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
		headers: c.req.raw.headers,
	});
};
