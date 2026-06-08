// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Validaciones
import type { BreakResponse } from "../../../src/lib/validations";
// Helpers
import { getSession } from "../_helpers";
import type { Bindings } from "../_helpers";
// OpenAPI
import { crearBreakRoute, listarBreaksRoute } from "../openapi/breaks";

// Registra las rutas de descansos en la aplicación
export function registerBreaks(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// POST /api/breaks - Registra un descanso completado o saltado
	app.openapi(crearBreakRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Valida y extrae los datos del body (tipo, status, minutos reales)
			const { tipo, status, minutesActual } = c.req.valid("json");
			// 3. Calcula los minutos planificados: 15 para largo, 5 para corto
			const minutesPlanned = tipo === "long" ? 15 : 5;

			// 4. Inserta el descanso en la base de datos
			const result = await c.env.DB.prepare(
				"INSERT INTO break (user_id, tipo, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, ?, ?, ?, ?)",
			)
				.bind(
					session.user.id,
					tipo,
					status,
					minutesPlanned,
					minutesActual || null,
					Date.now(),
				)
				.run();

			// 5. Responde con el descanso creado y código 201
			return c.json(
				{
					data: {
						id: result.meta.last_row_id,
						tipo,
						status,
						minutesPlanned,
						minutesActual: minutesActual ?? null,
						createdAt: Date.now(),
						completedAt: null,
					},
				},
				201,
			);
		} catch (err) {
			console.error("[Breaks] Error al crear:", err);
			return c.json({ error: "Error al registrar el descanso" }, 500);
		}
	});

	// GET /api/breaks - Lista descansos del día con filtro de fecha opcional
	app.openapi(listarBreaksRoute, async (c) => {
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

			// 4. Consulta los descansos del usuario en ese rango de fecha
			const { results } = await c.env.DB.prepare(
				"SELECT id, tipo, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt, completed_at as completedAt FROM break WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at",
			)
				.bind(session.user.id, inicioDelDia, finDelDia)
				.all<BreakResponse>();

			// 5. Responde con la lista de descansos
			return c.json({ data: results });
		} catch (err) {
			console.error("[Breaks] Error al listar:", err);
			return c.json({ error: "Error al listar descansos" }, 500);
		}
	});
}
