// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Validaciones
import type {
	PomodoroResponse,
	StatsResponse,
} from "../../../src/lib/validations";
// Helpers
import { getSession } from "../_helpers";
import type { Bindings } from "../_helpers";
// OpenAPI
import {
	crearPomodoroRoute,
	listarPomodorosRoute,
	statsPomodorosRoute,
} from "../openapi/pomodoros";

// Registra las rutas de pomodoros en la aplicación
export function registerPomodoros(
	app: OpenAPIHono<{ Bindings: Bindings }>,
) {
	// POST /api/pomodoros - Registra un pomodoro completado o interrumpido
	app.openapi(crearPomodoroRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida y extrae los datos del body (tareaId, status, minutos reales)
			const { tareaId, status, minutesActual } = c.req.valid("json");

			// 3. Inserta el pomodoro con 25 minutos planificados por defecto
			const result = await c.env.DB.prepare(
				"INSERT INTO pomodoro (tarea_id, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, 25, ?, ?)",
			)
				.bind(tareaId, status, minutesActual || null, Date.now())
				.run();

			// 4. Responde con el pomodoro creado y código 201
			return c.json(
				{
					data: {
						id: result.meta.last_row_id,
						tareaId,
						status,
						minutesPlanned: 25,
						minutesActual: minutesActual ?? null,
						createdAt: Date.now(),
					},
				},
				201,
			);
		} catch (err) {
			console.error("[Pomodoros] Error al crear:", err);
			return c.json({ error: "Error al registrar el pomodoro" }, 500);
		}
	});

	// GET /api/pomodoros - Lista pomodoros del día con join a tareas
	app.openapi(listarPomodorosRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Obtiene la fecha del query param o usa la fecha actual
			const { fecha: fechaQuery } = c.req.valid("query");
			const fecha = fechaQuery || new Date().toISOString().split("T")[0];
			// 3. Calcula el inicio y fin del día en timestamp
			const inicioDelDia = new Date(fecha).getTime();
			const finDelDia = inicioDelDia + 86400000;

			// 4. Consulta pomodoros del día con join a tareas para obtener el nombre
			const { results } = await c.env.DB.prepare(
				"SELECT p.id, p.tarea_id as tareaId, p.status, p.minutes_planned as minutesPlanned, p.minutes_actual as minutesActual, p.created_at as createdAt, t.nombre as tareaNombre FROM pomodoro p JOIN tarea t ON t.id = p.tarea_id WHERE t.user_id = ? AND p.created_at >= ? AND p.created_at < ? ORDER BY p.created_at DESC",
			)
				.bind(session.user.id, inicioDelDia, finDelDia)
				.all<PomodoroResponse>();

			// 5. Responde con la lista de pomodoros
			return c.json({ data: results });
		} catch (err) {
			console.error("[Pomodoros] Error al listar:", err);
			return c.json({ error: "Error al listar pomodoros" }, 500);
		}
	});

	// GET /api/pomodoros/stats - Estadísticas del día (total de pomodoros y tiempo acumulado)
	app.openapi(statsPomodorosRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Obtiene la fecha del query param o usa la fecha actual
			const { fecha: fechaQuery } = c.req.valid("query");
			const fecha = fechaQuery || new Date().toISOString().split("T")[0];
			// 3. Calcula el inicio y fin del día en timestamp
			const inicioDelDia = new Date(fecha).getTime();
			const finDelDia = inicioDelDia + 86400000;

			// 4. Consulta el total de pomodoros completados y el tiempo acumulado
			const stats = await c.env.DB.prepare(
				"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id IN (SELECT id FROM tarea WHERE user_id = ?) AND created_at >= ? AND created_at < ? AND status IN ('completed', 'completed_early')",
			)
				.bind(session.user.id, inicioDelDia, finDelDia)
				.first<StatsResponse>();

			// 5. Responde con las estadísticas
			return c.json({ data: stats });
		} catch (err) {
			console.error("[Pomodoros] Error al obtener stats:", err);
			return c.json({ error: "Error al obtener estadísticas" }, 500);
		}
	});
}
