// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// OpenAPI
import { saludRoute } from "../_openapi/health";
// Helpers
import type { Bindings } from "../_shared/types";

// Versión de la API reportada por el health check
const API_VERSION = "1.0.0";

// Registra la ruta pública de liveness del servicio
export function registerHealth(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// GET /api/health - Confirma que la Function responde (sin verificar dependencias)
	app.openapi(saludRoute, async (c) =>
		c.json(
			{
				status: "ok" as const,
				version: API_VERSION,
				timestamp: new Date().toISOString(),
			},
			200,
		),
	);
}
