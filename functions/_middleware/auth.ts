import type { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "../../src/lib/server/auth";
import type { Bindings } from "../_shared/types";

// Catch-all que delega a Better Auth: flujo de auth, sesión y rate limit nativo
export function registerAuth(app: OpenAPIHono<{ Bindings: Bindings }>) {
	app.all("*", async (c) => {
		const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);
		return authInstance.handler(c.req.raw);
	});
}
