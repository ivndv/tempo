// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Validaciones
import type { CategoriaResponse } from "../../../src/lib/validations";
// Helpers
import { getSession } from "../_helpers";
import type { Bindings } from "../_helpers";
// OpenAPI
import { listarCategoriasRoute, seedCategoriasRoute } from "../openapi/categorias";

// Registra las rutas de categorías en la aplicación
export function registerCategorias(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// GET /api/categorias - Lista todas las categorías del usuario autenticado
	app.openapi(listarCategoriasRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Consulta todas las categorías del usuario ordenadas por id
			const { results } = await c.env.DB.prepare(
				"SELECT id, nombre FROM categoria WHERE user_id = ? ORDER BY id",
			)
				.bind(session.user.id)
				.all<CategoriaResponse>();

			// 3. Responde con la lista de categorías
			return c.json({ data: results });
		} catch (err) {
			console.error("[Categorías] Error al listar:", err);
			return c.json({ error: "Error al listar categorías" }, 500);
		}
	});

	// POST /api/categorias/seed - Crea las 3 categorías por defecto (Trabajo, Estudio, Personal)
	app.openapi(seedCategoriasRoute, async (c) => {
		try {
			// 1. Verifica que el usuario esté autenticado
			const session = await getSession(c);
			if (!session) return c.json({ error: "Unauthorized" }, 401);

			// 2. Define las tres categorías por defecto para el usuario
			const defaults = [
				{ nombre: "Trabajo", userId: session.user.id },
				{ nombre: "Estudio", userId: session.user.id },
				{ nombre: "Personal", userId: session.user.id },
			];

			// 3. Inserta las categorías en la base de datos
			await c.env.DB.prepare(
				"INSERT INTO categoria (nombre, user_id) VALUES (?, ?), (?, ?), (?, ?)",
			)
				.bind(
					defaults[0].nombre,
					defaults[0].userId,
					defaults[1].nombre,
					defaults[1].userId,
					defaults[2].nombre,
					defaults[2].userId,
				)
				.run();

			// 4. Consulta las categorías recién creadas
			const { results } = await c.env.DB.prepare(
				"SELECT id, nombre, user_id FROM categoria WHERE user_id = ? ORDER BY id DESC LIMIT 3",
			)
				.bind(session.user.id)
				.all();

			// 5. Responde con las categorías creadas
			return c.json({ data: results });
		} catch (err) {
			console.error("[Categorías] Error al crear seed:", err);
			return c.json({ error: "Error al crear categorías por defecto" }, 500);
		}
	});
}
