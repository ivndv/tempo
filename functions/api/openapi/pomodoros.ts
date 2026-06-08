// OpenAPI
import { createRoute } from "@hono/zod-openapi";
// Zod
import { z } from "zod";
// Validaciones
import {
	crearPomodoroSchema,
	listarPomodorosQuery,
	pomodoroResponse as pomodoroResponseSchema,
	statsQuery,
	statsResponse as statsResponseSchema,
} from "../../../src/lib/validations";
// Helpers
import { dataResponse, errorSchema } from "../_helpers";

// Define la ruta para registrar un pomodoro
export const crearPomodoroRoute = createRoute({
	method: "post",
	path: "/pomodoros",
	tags: ["Pomodoros"],
	description: "Registrar un pomodoro completado o interrumpido",
	request: {
		body: {
			content: { "application/json": { schema: crearPomodoroSchema } },
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: dataResponse(
						pomodoroResponseSchema,
						"PomodoroCreadoResponse",
					),
				},
			},
			description: "Pomodoro registrado",
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

// Define la ruta para listar pomodoros del día
export const listarPomodorosRoute = createRoute({
	method: "get",
	path: "/pomodoros",
	tags: ["Pomodoros"],
	description: "Listar pomodoros del día (opcionalmente filtrar por fecha)",
	request: { query: listarPomodorosQuery },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						z.array(pomodoroResponseSchema),
						"PomodorosResponse",
					),
				},
			},
			description: "Pomodoros del día",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});

// Define la ruta para obtener estadísticas del día
export const statsPomodorosRoute = createRoute({
	method: "get",
	path: "/pomodoros/stats",
	tags: ["Pomodoros"],
	description:
		"Obtener estadísticas de pomodoros del día (total y tiempo acumulado)",
	request: { query: statsQuery },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(statsResponseSchema, "StatsResponse"),
				},
			},
			description: "Estadísticas de pomodoros del día",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});
