// OpenAPI
import { createRoute } from "@hono/zod-openapi";
// Zod
import { z } from "zod";
import { categoriaResponse as categoriaResponseSchema } from "../../src/lib/shared/validations";
// Helpers
import { dataResponse, errorSchema } from "../_shared/helpers";

// Define la ruta para listar categorías del usuario
export const listarCategoriasRoute = createRoute({
	method: "get",
	path: "/categorias",
	tags: ["Categorías"],
	description: "Listar todas las categorías del usuario autenticado",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						z.array(categoriaResponseSchema),
						"CategoriasResponse",
					),
				},
			},
			description: "Lista de categorías del usuario",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
		500: {
			content: { "application/json": { schema: errorSchema } },
			description: "Error interno del servidor",
		},
	},
});

// Define la ruta para crear las categorías por defecto
export const seedCategoriasRoute = createRoute({
	method: "post",
	path: "/categorias/seed",
	tags: ["Categorías"],
	description:
		"Crear las tres categorías por defecto (Trabajo, Estudio, Personal)",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: dataResponse(
						z.array(categoriaResponseSchema),
						"CategoriasSeedResponse",
					),
				},
			},
			description: "Categorías por defecto creadas",
		},
		401: {
			content: { "application/json": { schema: errorSchema } },
			description: "No autenticado",
		},
		500: {
			content: { "application/json": { schema: errorSchema } },
			description: "Error interno del servidor",
		},
	},
});
