import type { RateLimitRule } from "./types";

// Ventana y máximo por defecto para los endpoints internos (100 req / 60s)
export const REGLA_INTERNA: RateLimitRule = { window: 60, max: 100 };

// Resuelve la regla interna permitiendo override del máximo por binding (pruebas)
export const resolverReglaInterna = (maxEnv?: string): RateLimitRule => {
	const max = Number(maxEnv);
	return {
		window: REGLA_INTERNA.window,
		max: Number.isFinite(max) && max > 0 ? max : REGLA_INTERNA.max,
	};
};

// Indica si la ruta queda exenta del limiter propio:
//  - /api/auth/* lo cubre el rate limit nativo de Better Auth
//  - GET /api/health se exime para no romper el monitoreo
//  - OPTIONS (preflight) nunca se cuenta
export const esRutaExenta = (path: string, method: string): boolean => {
	if (method === "OPTIONS") return true;
	if (path.startsWith("/api/auth")) return true;
	if (path === "/api/health") return true;
	return false;
};

// Elige el identificador del cliente: usuario autenticado si existe, si no IP
export const elegirIdentificador = (
	userId: string | null | undefined,
	ip: string,
): string => userId || ip;

// Construye la clave del limiter interno (identificador + ruta)
export const construirClaveInterna = (identificador: string, path: string) =>
	`api:${identificador}:${path}`;
