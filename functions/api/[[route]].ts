// OpenAPI
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/cloudflare-pages";

// Rutas de la API
import { registerBreaks } from "./handlers/breaks";
import { registerCategorias } from "./handlers/categorias";
import { registerPomodoros } from "./handlers/pomodoros";
import { registerTareas } from "./handlers/tareas";

// Documentación y autenticación
import { registerAuth } from "./_auth";
import { registerDocs } from "./_docs";

import type { Bindings } from "./_helpers";

// Crea la app Hono con OpenAPI para documentación automática de endpoints
const app = new OpenAPIHono<{ Bindings: Bindings }>().basePath("/api");

// Registra los handlers de cada recurso de la API
registerCategorias(app);
registerTareas(app);
registerPomodoros(app);
registerBreaks(app);

// Registra la documentación OpenAPI (Swagger UI en /api/docs) y el handler de Better Auth
registerDocs(app);
registerAuth(app);

export const onRequest = handle(app);
