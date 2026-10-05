import { z } from "@hono/zod-openapi";
import { auth } from "../../src/lib/server/auth";
import type { Bindings } from "./types";

// Schema base para respuestas de error (string o detalle)
export const errorSchema = z.object({
	error: z.union([z.string(), z.record(z.string(), z.any())]),
});

// Schema base para respuestas exitosas simples
export const successSchema = z.object({ success: z.boolean() });

// Envuelve un schema de datos en { data: schema } para respuestas REST
export function dataResponse<T extends z.ZodType>(schema: T, name: string) {
	return z.object({ data: schema }).openapi(name);
}

// Obtiene la sesión actual de Better Auth desde los headers de la request
export const getSession = async (c: {
	env: Bindings;
	req: { raw: { headers: Headers } };
}) => {
	return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
		headers: c.req.raw.headers,
	});
};
