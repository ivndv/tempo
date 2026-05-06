/// <reference path="../.astro/types.d.ts" />

// Definición de tipos para Cloudflare Workers
type D1Database = import("@cloudflare/workers-types").D1Database;
type KVNamespace = import("@cloudflare/workers-types").KVNamespace;

/**
 * Definición de las variables de entorno para Cloudflare
 */
type ENV = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
};

/**
 * Espacio de nombres Global para Astro
 * Define el tipado de Astro.locals para tener autocompletado y seguridad de tipos
 */
declare namespace App {
	interface Locals {
		// Datos del usuario y sesión inyectados por el middleware de autenticación
		user: import("better-auth").User | null;
		session: import("better-auth").Session | null;

		// Contexto de ejecución de Cloudflare
		runtime: import("@astrojs/cloudflare").Runtime<ENV> & {
			data: {
				user: import("better-auth").User | null;
				session: import("better-auth").Session | null;
			};
		};
	}
}
