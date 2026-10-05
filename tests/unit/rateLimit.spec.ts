// Tests unitarios de la policy de rate limiting (exenciones y resolución de regla)
import { describe, expect, it } from "vitest";
import {
	construirClaveInterna,
	elegirIdentificador,
	esRutaExenta,
	REGLA_INTERNA,
	resolverReglaInterna,
} from "../../functions/_shared/rate-limit/rules";

describe("rate-limit — policy", () => {
	describe("esRutaExenta", () => {
		it("exime el flujo nativo de Better Auth", () => {
			expect(esRutaExenta("/api/auth/sign-in/email", "POST")).toBe(true);
		});

		it("exime el health para no romper el monitoreo", () => {
			expect(esRutaExenta("/api/health", "GET")).toBe(true);
		});

		it("exime el preflight OPTIONS", () => {
			expect(esRutaExenta("/api/tareas", "OPTIONS")).toBe(true);
		});

		it("protege los endpoints internos", () => {
			expect(esRutaExenta("/api/tareas", "GET")).toBe(false);
			expect(esRutaExenta("/api/openapi", "GET")).toBe(false);
		});
	});

	describe("resolverReglaInterna", () => {
		it("usa el máximo por defecto cuando no hay binding", () => {
			expect(resolverReglaInterna()).toEqual(REGLA_INTERNA);
			expect(resolverReglaInterna("")).toEqual(REGLA_INTERNA);
		});

		it("usa el override del binding cuando es válido", () => {
			expect(resolverReglaInterna("5")).toMatchObject({
				window: 60,
				max: 5,
			});
		});

		it("ignora overrides inválidos o no positivos", () => {
			expect(resolverReglaInterna("abc")).toEqual(REGLA_INTERNA);
			expect(resolverReglaInterna("0")).toEqual(REGLA_INTERNA);
			expect(resolverReglaInterna("-3")).toEqual(REGLA_INTERNA);
		});
	});

	describe("identificador y clave (user-or-IP)", () => {
		it("prefiere el userId cuando hay usuario autenticado", () => {
			expect(elegirIdentificador("user-123", "1.2.3.4")).toBe("user-123");
		});

		it("cae a IP cuando no hay usuario", () => {
			expect(elegirIdentificador(undefined, "1.2.3.4")).toBe("1.2.3.4");
			expect(elegirIdentificador(null, "1.2.3.4")).toBe("1.2.3.4");
			expect(elegirIdentificador("", "1.2.3.4")).toBe("1.2.3.4");
		});

		it("construye la clave interna con prefijo api:", () => {
			expect(construirClaveInterna("user-123", "/api/tareas")).toBe(
				"api:user-123:/api/tareas",
			);
		});
	});
});
