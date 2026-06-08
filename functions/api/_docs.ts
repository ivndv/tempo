import { swaggerUI } from "@hono/swagger-ui";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "./_helpers";

// Registra los endpoints de documentación: schema OpenAPI en /api/openapi y Swagger UI en /api/docs
export function registerDocs(app: OpenAPIHono<{ Bindings: Bindings }>) {
	app.doc("/openapi", {
		openapi: "3.0.0",
		info: {
			title: "Tempo API",
			version: "1.0.0",
			description: "API de la aplicación Tempo Pomodoro",
		},
		servers: [
			{ url: "https://tempo.mgdc.site", description: "Producción" },
			{ url: "http://localhost:4321", description: "Local" },
		],
	});

	app.get("/docs", swaggerUI({ url: "/api/openapi" }));
}
