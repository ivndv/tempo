import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

/**
 * Variables de entorno y bindings de Cloudflare Workers (D1, KV, Secrets)
 */
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
	// Override del máximo de peticiones del rate limiter interno (solo pruebas)
	RATE_LIMIT_MAX_INTERNAL?: string;
};
