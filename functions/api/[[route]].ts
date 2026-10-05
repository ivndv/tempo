// OpenAPI
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/cloudflare-pages";
// Controladores de la API
import { registerBreaks } from "../_controllers/breaks";
import { registerCategorias } from "../_controllers/categorias";
import { registerHealth } from "../_controllers/health";
import { registerPomodoros } from "../_controllers/pomodoros";
import { registerTareas } from "../_controllers/tareas";
// Middleware, Documentación y Autenticación
import { registerAuth } from "../_middleware/auth";
import { registerDocs } from "../_middleware/docs";
import { registerErrors } from "../_middleware/errors";
import { registerRateLimit } from "../_middleware/rate-limit";
// Tipos
import type { Bindings } from "../_shared/types";

// Crea la app Hono con OpenAPI para documentación automática de endpoints
const app = new OpenAPIHono<{ Bindings: Bindings }>().basePath("/api");

// Rate limiting propio (usuario autenticado o IP) antes de los controladores y del catch-all
registerRateLimit(app);

// Registra los controladores de cada recurso de la API
registerCategorias(app);
registerTareas(app);
registerPomodoros(app);
registerBreaks(app);

// Registra el health check antes del catch-all de auth para que no lo capture
registerHealth(app);

// Registra la documentación OpenAPI (Swagger UI en /api/docs) y el handler de Better Auth
registerDocs(app);
registerAuth(app);

// Registra el manejo global de errores y 404 (último para no pisar rutas existentes)
registerErrors(app);

export const onRequest = handle(app);
