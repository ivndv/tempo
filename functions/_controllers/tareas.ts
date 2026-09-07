// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Drizzle
import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
// Schema
import { pomodoro, tarea } from "../../src/db/schema";
// Helpers & DB
import { dateToTimestamp, dateToTimestampRequired, getDb } from "../_db/db";
// OpenAPI
import {
	actualizarTareaRoute,
	crearTareaRoute,
	eliminarTareaRoute,
	listarTareasRoute,
	obtenerTareaRoute,
} from "../_openapi/tareas";
import { getSession } from "../_shared/helpers";
import type { Bindings } from "../_shared/types";

// Registra las rutas de tareas en la aplicación
export function registerTareas(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// GET /api/tareas - Lista tareas con filtro opcional por estado y paginación por cursor
	app.openapi(listarTareasRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Obtiene filtros y parámetros de paginación desde query params
		const { estado, limit = 50, cursor } = c.req.valid("query");

		// 3. Construye condiciones dinámicas usando el índice usuario + fecha
		const condiciones = [eq(tarea.userId, session.user.id)];
		if (estado) condiciones.push(eq(tarea.estado, estado));
		if (cursor) condiciones.push(lt(tarea.createdAt, new Date(cursor)));

		// 4. Consulta limit + 1 registros para determinar si existen más páginas
		const db = getDb(c.env);
		const rows = await db
			.select({
				id: tarea.id,
				nombre: tarea.nombre,
				categoriaId: tarea.categoriaId,
				estado: tarea.estado,
				createdAt: tarea.createdAt,
				completedAt: tarea.completedAt,
			})
			.from(tarea)
			.where(and(...condiciones))
			.orderBy(desc(tarea.createdAt))
			.limit(limit + 1);

		// 5. Determina si existen más páginas y recorta al límite solicitado
		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		// 6. Convierte las fechas a timestamps numéricos y responde
		const results = items.map((t) => ({
			...t,
			createdAt: dateToTimestampRequired(t.createdAt),
			completedAt: dateToTimestamp(t.completedAt),
		}));

		const lastItem = results[results.length - 1];
		const nextCursor = hasMore && lastItem ? lastItem.createdAt : null;

		return c.json(
			{
				data: results,
				pagination: {
					nextCursor,
					hasMore,
				},
			},
			200,
		);
	});

	// GET /api/tareas/{id} - Obtiene detalle de tarea + pomodoros + estadísticas
	app.openapi(obtenerTareaRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida el ID de la tarea desde el parámetro de ruta
		const { id } = c.req.valid("param");

		// 3. Consulta la tarea asegurando que pertenezca al usuario
		const db = getDb(c.env);
		const tareaRow = await db
			.select({
				id: tarea.id,
				nombre: tarea.nombre,
				categoriaId: tarea.categoriaId,
				estado: tarea.estado,
				createdAt: tarea.createdAt,
				completedAt: tarea.completedAt,
			})
			.from(tarea)
			.where(and(eq(tarea.id, id), eq(tarea.userId, session.user.id)))
			.get();

		// 4. Si no existe, responde con 404
		if (!tareaRow) return c.json({ error: "Tarea no encontrada" }, 404);

		// 5. Consulta los pomodoros asociados a la tarea
		const pomodorosRows = await db
			.select({
				id: pomodoro.id,
				status: pomodoro.status,
				minutesPlanned: pomodoro.minutesPlanned,
				minutesActual: pomodoro.minutesActual,
				createdAt: pomodoro.createdAt,
			})
			.from(pomodoro)
			.where(eq(pomodoro.tareaId, id))
			.orderBy(pomodoro.createdAt);

		// 6. Consulta las estadísticas de la tarea
		const [statsRow] = await db
			.select({
				total: count(),
				totalTime: sql<number>`coalesce(SUM(${pomodoro.minutesActual}), 0)`,
			})
			.from(pomodoro)
			.where(
				and(
					eq(pomodoro.tareaId, id),
					inArray(pomodoro.status, [
						"completed",
						"completed_early",
						"interrupted",
					]),
				),
			);

		// 7. Responde con el detalle completo de la tarea
		return c.json(
			{
				data: {
					...tareaRow,
					createdAt: dateToTimestampRequired(tareaRow.createdAt),
					completedAt: dateToTimestamp(tareaRow.completedAt),
					pomodoros: pomodorosRows.map((p) => ({
						...p,
						createdAt: dateToTimestampRequired(p.createdAt),
					})),
					stats: statsRow ?? { total: 0, totalTime: 0 },
				},
			},
			200,
		);
	});

	// POST /api/tareas - Crea una nueva tarea
	app.openapi(crearTareaRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida y extrae los datos del body (nombre, categoría opcional)
		const { nombre, categoriaId } = c.req.valid("json");

		// 3. Inserta la nueva tarea en la base de datos
		const db = getDb(c.env);
		const [row] = await db
			.insert(tarea)
			.values({
				nombre,
				categoriaId: categoriaId ?? null,
				userId: session.user.id,
				createdAt: new Date(),
			})
			.returning({ id: tarea.id });

		// 4. Responde con la tarea creada y código 201
		return c.json(
			{
				data: {
					id: row.id,
					nombre,
					categoriaId: categoriaId ?? null,
					estado: "pending" as const,
					createdAt: Date.now(),
					completedAt: null,
				},
			},
			201,
		);
	});

	// PATCH /api/tareas/{id} - Actualiza campos parciales de una tarea
	app.openapi(actualizarTareaRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida el ID y los datos a actualizar
		const { id } = c.req.valid("param");
		const data = c.req.valid("json");

		// 3. Construye el objeto de actualización con los campos presentes
		const updates: Partial<typeof tarea.$inferInsert> = {};
		if (data.nombre !== undefined) updates.nombre = data.nombre;
		if (data.categoriaId !== undefined) updates.categoriaId = data.categoriaId;
		if (data.estado !== undefined) {
			updates.estado = data.estado;
			if (data.estado === "done") updates.completedAt = new Date();
		}

		// 4. Si no hay campos para actualizar, responde con 400
		if (Object.keys(updates).length === 0)
			return c.json({ error: "Sin campos para actualizar" }, 400);

		// 5. Ejecuta la actualización en la base de datos
		const db = getDb(c.env);
		await db
			.update(tarea)
			.set(updates)
			.where(and(eq(tarea.id, id), eq(tarea.userId, session.user.id)));

		// 6. Responde con éxito
		return c.json({ success: true }, 200);
	});

	// DELETE /api/tareas/{id} - Elimina tarea y sus pomodoros asociados
	app.openapi(eliminarTareaRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida el ID de la tarea desde el parámetro de ruta
		const { id } = c.req.valid("param");

		// 3. Elimina los pomodoros asociados a la tarea
		const db = getDb(c.env);
		await db.delete(pomodoro).where(eq(pomodoro.tareaId, id));
		// 4. Elimina la tarea asegurando que pertenezca al usuario
		await db
			.delete(tarea)
			.where(and(eq(tarea.id, id), eq(tarea.userId, session.user.id)));

		// 5. Responde con éxito
		return c.json({ success: true }, 200);
	});
}
