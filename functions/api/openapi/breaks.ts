// OpenAPI
import { createRoute } from "@hono/zod-openapi";
// Zod
import { z } from "zod";
// Validaciones
import {
	breakResponse as breakResponseSchema,
	crearBreakSchema,
	listarPomodorosQuery,
} from "../../../src/lib/validations";
// Helpers
import { dataResponse, errorSchema } from "../_helpers";

// Define la ruta para registrar un descanso
export const crearBreakRoute = createRoute({
	method: "post",
	path: "/breaks",
	tags: ["Descansos"],
	description: "Registrar un descanso completado o saltado",
	request: {
		body: {
			content: { "application/json": { schema: crearBreakSchema } },
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: dataResponse(breakResponseSchema, "BreakCreadoResponse"),
				},
			},
			description: "Break registrado",
		},
		400: {
			content: { "application/json": { schema: errorSchema } },
			description: "Datos inválidos",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});

// Define la ruta para listar descansos del día
export const listarBreaksRoute = createRoute({
	method: "get",
	path: "/breaks",
	tags: ["Descansos"],
	description:
		"Listar descansos del día (opcionalmente filtrar por fecha)",
	request: { query: listarPomodorosQuery },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						z.array(breakResponseSchema),
						"BreaksResponse",
					),
				},
			},
			description: "Breaks del día",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});
