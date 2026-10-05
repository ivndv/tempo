// OpenAPI
import { createRoute } from "@hono/zod-openapi";
// Zod
import { z } from "zod";
// Helpers
import { errorSchema } from "../_shared/helpers";

// Respuesta del health endpoint (liveness puro): estado, versión y timestamp
export const saludResponseSchema = z
	.object({
		status: z.literal("ok"),
		version: z.string(),
		timestamp: z.string(),
	})
	.openapi("SaludResponse");

// Define la ruta pública de liveness: confirma que el servicio responde
export const saludRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Sistema"],
	description: "Verificar que el servicio responde (liveness)",
	responses: {
		200: {
			content: { "application/json": { schema: saludResponseSchema } },
			description: "Servicio operativo",
		},
		500: {
			content: { "application/json": { schema: errorSchema } },
			description: "Error interno del servidor",
		},
	},
});
