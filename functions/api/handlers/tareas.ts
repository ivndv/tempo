// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Validaciones
import type {
	StatsResponse,
	TareaResponse,
} from "../../../src/lib/validations";
// Helpers
import { getSession } from "../_helpers";
import type { Bindings } from "../_helpers";
// OpenAPI
import {
	actualizarTareaRoute,
	crearTareaRoute,
	eliminarTareaRoute,
	listarTareasRoute,
	obtenerTareaRoute,
} from "../openapi/tareas";

// Registra las rutas de tareas en la aplicación
export function registerTareas(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// GET /api/tareas - Lista tareas con filtro opcional por estado
	app.openapi(listarTareasRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Obtiene el filtro opcional de estado desde los query params
			const { estado } = c.req.valid("query");

			// 3. Construye la consulta SQL dinámicamente según el filtro
			let query =
				"SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE user_id = ?";
			const params: (string | number)[] = [session.user.id];

			if (estado) {
				query += " AND estado = ?";
				params.push(estado);
			}

			query += " ORDER BY created_at DESC";

			// 4. Ejecuta la consulta con los parámetros correspondientes
			const { results } = await c.env.DB.prepare(query)
				.bind(...params)
				.all<TareaResponse>();

			// 5. Responde con la lista de tareas
			return c.json({ data: results });
		} catch (err) {
			console.error("[Tareas] Error al listar:", err);
			return c.json({ error: "Error al listar tareas" }, 500);
		}
	});

	// GET /api/tareas/{id} - Obtiene detalle de tarea + pomodoros + estadísticas
	app.openapi(obtenerTareaRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida el ID de la tarea desde el parámetro de ruta
			const { id } = c.req.valid("param");

			// 3. Consulta la tarea asegurando que pertenezca al usuario
			const tarea = await c.env.DB.prepare(
				"SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE id = ? AND user_id = ?",
			)
				.bind(id, session.user.id)
				.first<TareaResponse>();

			// 4. Si no existe, responde con 404
			if (!tarea) return c.json({ error: "Tarea no encontrada" }, 404);

			// 5. Consulta los pomodoros asociados a la tarea
			const pomodoros = await c.env.DB.prepare(
				"SELECT id, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt FROM pomodoro WHERE tarea_id = ? ORDER BY created_at",
			)
				.bind(id)
				.all();

			// 6. Consulta las estadísticas de la tarea
			const stats = await c.env.DB.prepare(
				"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id = ? AND status IN ('completed', 'completed_early')",
			)
				.bind(id)
				.first<StatsResponse>();

			// 7. Responde con el detalle completo de la tarea
			return c.json({ data: { ...tarea, pomodoros: pomodoros.results, stats } });
		} catch (err) {
			console.error("[Tareas] Error al obtener detalle:", err);
			return c.json({ error: "Error al obtener detalle de la tarea" }, 500);
		}
	});

	// POST /api/tareas - Crea una nueva tarea
	app.openapi(crearTareaRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida y extrae los datos del body (nombre, categoría opcional)
			const { nombre, categoriaId } = c.req.valid("json");

			// 3. Inserta la nueva tarea en la base de datos
			const result = await c.env.DB.prepare(
				"INSERT INTO tarea (nombre, categoria_id, user_id, created_at) VALUES (?, ?, ?, ?)",
			)
				.bind(nombre, categoriaId || null, session.user.id, Date.now())
				.run();

			// 4. Responde con la tarea creada y código 201
			return c.json(
				{
					data: {
						id: result.meta.last_row_id,
						nombre,
						categoriaId: categoriaId ?? null,
						estado: "pending" as const,
						createdAt: Date.now(),
						completedAt: null,
					},
				},
				201,
			);
		} catch (err) {
			console.error("[Tareas] Error al crear:", err);
			return c.json({ error: "Error al crear la tarea" }, 500);
		}
	});

	// PATCH /api/tareas/{id} - Actualiza campos parciales de una tarea
	app.openapi(actualizarTareaRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida el ID y los datos a actualizar
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");

			// 3. Construye la consulta dinámicamente con los campos presentes
			const sets: string[] = [];
			const params: (string | number | null)[] = [];

			if (data.nombre !== undefined) {
				sets.push("nombre = ?");
				params.push(data.nombre);
			}
			if (data.categoriaId !== undefined) {
				sets.push("categoria_id = ?");
				params.push(data.categoriaId);
			}
			if (data.estado !== undefined) {
				sets.push("estado = ?");
				params.push(data.estado);
				if (data.estado === "done") {
					sets.push("completed_at = ?");
					params.push(Date.now());
				}
			}

			// 4. Si no hay campos para actualizar, responde con 400
			if (sets.length === 0)
				return c.json({ error: "Sin campos para actualizar" }, 400);

			params.push(id, session.user.id);

			// 5. Ejecuta la actualización en la base de datos
			await c.env.DB.prepare(
				`UPDATE tarea SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
			)
				.bind(...params)
				.run();

			// 6. Responde con éxito
			return c.json({ success: true });
		} catch (err) {
			console.error("[Tareas] Error al actualizar:", err);
			return c.json({ error: "Error al actualizar la tarea" }, 500);
		}
	});

	// DELETE /api/tareas/{id} - Elimina tarea y sus pomodoros asociados
	app.openapi(eliminarTareaRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida el ID de la tarea desde el parámetro de ruta
			const { id } = c.req.valid("param");

			// 3. Elimina los pomodoros asociados a la tarea
			await c.env.DB.prepare("DELETE FROM pomodoro WHERE tarea_id = ?")
				.bind(id)
				.run();
			// 4. Elimina la tarea asegurando que pertenezca al usuario
			await c.env.DB.prepare("DELETE FROM tarea WHERE id = ? AND user_id = ?")
				.bind(id, session.user.id)
				.run();

			// 5. Responde con éxito
			return c.json({ success: true });
		} catch (err) {
			console.error("[Tareas] Error al eliminar:", err);
			return c.json({ error: "Error al eliminar la tarea" }, 500);
		}
	});
}
