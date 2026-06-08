// OpenAPI
import { createRoute } from "@hono/zod-openapi";
// Zod
import { z } from "zod";
// Validaciones
import {
	actualizarTareaSchema,
	crearTareaSchema,
	idParamSchema,
	listarTareasQuery,
	tareaDetalleResponse as tareaDetalleResponseSchema,
	tareaResponse as tareaResponseSchema,
} from "../../../src/lib/validations";
// Helpers
import { dataResponse, errorSchema, successSchema } from "../_helpers";

// Define la ruta para listar tareas
export const listarTareasRoute = createRoute({
	method: "get",
	path: "/tareas",
	tags: ["Tareas"],
	description: "Listar tareas del usuario con filtro opcional por estado",
	request: { query: listarTareasQuery },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						z.array(tareaResponseSchema),
						"TareasResponse",
					),
				},
			},
			description: "Lista de tareas del usuario",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});

// Define la ruta para obtener detalle de una tarea
export const obtenerTareaRoute = createRoute({
	method: "get",
	path: "/tareas/{id}",
	tags: ["Tareas"],
	description:
		"Obtener detalle de una tarea con sus pomodoros y estadísticas",
	request: { params: z.object({ id: idParamSchema }) },
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						tareaDetalleResponseSchema,
						"TareaDetalleResponse",
					),
				},
			},
			description: "Detalle de tarea con pomodoros y estadísticas",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
		404: {
			content: { "application/json": { schema: errorSchema } },
			description: "Tarea no encontrada",
		},
	},
});

// Define la ruta para crear una tarea
export const crearTareaRoute = createRoute({
	method: "post",
	path: "/tareas",
	tags: ["Tareas"],
	description: "Crear una nueva tarea",
	request: {
		body: { content: { "application/json": { schema: crearTareaSchema } } },
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: dataResponse(tareaResponseSchema, "TareaCreadaResponse"),
				},
			},
			description: "Tarea creada",
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

// Define la ruta para actualizar parcialmente una tarea
export const actualizarTareaRoute = createRoute({
	method: "patch",
	path: "/tareas/{id}",
	tags: ["Tareas"],
	description:
		"Actualizar parcialmente una tarea (nombre, categoría o estado)",
	request: {
		params: z.object({ id: idParamSchema }),
		body: {
			content: { "application/json": { schema: actualizarTareaSchema } },
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: successSchema } },
			description: "Tarea actualizada",
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

// Define la ruta para eliminar una tarea
export const eliminarTareaRoute = createRoute({
	method: "delete",
	path: "/tareas/{id}",
	tags: ["Tareas"],
	description: "Eliminar una tarea y sus pomodoros asociados",
	request: { params: z.object({ id: idParamSchema }) },
	responses: {
		200: {
			content: { "application/json": { schema: successSchema } },
			description: "Tarea eliminada",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
	},
});
