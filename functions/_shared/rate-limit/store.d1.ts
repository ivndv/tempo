import type { D1Database } from "@cloudflare/workers-types";
import type { RateLimitStore } from "./types";

// UPSERT atómico de ventana fija: inserta o reinicia/expande el contador y devuelve el conteo nuevo
const UPSERT_SQL = `
INSERT INTO rate_limit (id, key, count, lastRequest)
VALUES (?, ?, 1, ?)
ON CONFLICT(key) DO UPDATE SET
  count = CASE WHEN rate_limit.lastRequest <= ? THEN 1 ELSE rate_limit.count + 1 END,
  lastRequest = CASE WHEN rate_limit.lastRequest <= ? THEN excluded.lastRequest ELSE rate_limit.lastRequest END
RETURNING count, lastRequest
`;

// Crea un store de rate limiting sobre D1 usando la tabla compartida rate_limit
export const crearStoreD1 = (db: D1Database): RateLimitStore => ({
	consume: async (key, rule) => {
		// 1. Calcula el instante de inicio de la ventana vigente
		const now = Date.now();
		const windowMs = rule.window * 1000;
		const inicioVentana = now - windowMs;

		// 2. Ejecuta el UPSERT atómico y obtiene el conteo resultante
		const row = await db
			.prepare(UPSERT_SQL)
			.bind(crypto.randomUUID(), key, now, inicioVentana, inicioVentana)
			.first<{ count: number; lastRequest: number }>();

		const count = row?.count ?? 1;
		const lastRequest = row?.lastRequest ?? now;
		const resetAt = lastRequest + windowMs;

		// 3. Decide si la petición entra dentro del límite
		return {
			allowed: count <= rule.max,
			limit: rule.max,
			remaining: Math.max(0, rule.max - count),
			resetAt,
			retryAfter: Math.max(0, Math.ceil((resetAt - now) / 1000)),
		};
	},
});
