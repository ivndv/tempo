// Cloudflare
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
// Autenticación
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
// Base de datos
import { drizzle } from "drizzle-orm/d1";
// Email
import { Resend } from "resend";
// Schema
import * as schema from "../db/schema";
// Plugins
import { captcha } from "better-auth/plugins";

// Tipos de respuestas del servicio de hash externo
interface HashResponse {
	data: { hash: string };
}
interface VerifyResponse {
	data: { match: boolean };
}

// Verifica que el servicio de hash esté disponible
const checkHashService = async (url: string): Promise<boolean> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 2000);

	try {
		// Llama al health endpoint del servicio de hash
		const res = await fetch(`${url}/health`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);
		return res.ok;
	} catch {
		clearTimeout(timeout);
		return false;
	}
};

// Fetch con timeout para evitar colgarse si el servicio no responde
const fetchWithTimeout = async (
	url: string,
	options: RequestInit,
	timeoutMs = 5000,
): Promise<Response> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		// Ejecuta el fetch con señal de aborto
		const res = await fetch(url, { ...options, signal: controller.signal });
		clearTimeout(timeout);
		return res;
	} catch {
		clearTimeout(timeout);
		throw new Error("Servicio de autenticación no disponible");
	}
};

// Configura y retorna la instancia de Better Auth con D1, KV y email
export const auth = (
	db: D1Database,
	kv: KVNamespace | null,
	env?: {
		BETTER_AUTH_SECRET?: string;
		BETTER_AUTH_URL?: string;
		TURNSTILE_SECRET_KEY?: string;
		HASH_SERVICE_URL?: string;
		HASH_SERVICE_API_KEY?: string;
		RESEND_API_KEY?: string;
		RESEND_FROM?: string;
	},
) => {
	// 1. Valida que la base de datos exista
	if (!db) {
		throw new Error("Se requiere base de datos (D1) para autenticación");
	}

	// 2. Inicializa Drizzle con el schema
	const drizzleDb = drizzle(db, { schema });

	// 3. Configura Better Auth
	const authInstance = betterAuth({
		// 3a. Adaptador de base de datos (SQLite vía D1)
		database: drizzleAdapter(drizzleDb, {
			provider: "sqlite",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		secret: env?.BETTER_AUTH_SECRET,
		baseURL: env?.BETTER_AUTH_URL,

		// 3b. Configuración de sesiones
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 8,
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
				strategy: "compact",
			},
			storeSessionInDatabase: true,
		},

		// 3c. Almacenamiento secundario en KV para sesiones
		secondaryStorage: kv
			? {
					get: async (key: string) => {
						const value = await kv.get(key);
						return value ? JSON.parse(value) : null;
					},
					set: async (key: string, value: unknown, ttl?: number) => {
						try {
							if (ttl !== undefined) {
								const safeTtl = Math.max(60, ttl);
								await kv.put(key, JSON.stringify(value), {
									expirationTtl: safeTtl,
								});
							} else {
								await kv.put(key, JSON.stringify(value));
							}
						} catch (e) {
							console.warn("[KV] fallback sin TTL:", e);
							await kv.put(key, JSON.stringify(value));
						}
					},
					delete: async (key: string) => {
						await kv.delete(key);
					},
				}
			: undefined,

		// 3d. Email y contraseña con hash externo y reset por email
		emailAndPassword: {
			enabled: true,
			autoSignIn: false,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				// 3d1. Verifica que RESEND_API_KEY esté configurada
				if (!env?.RESEND_API_KEY) {
					console.error("[Auth] RESEND_API_KEY no configurada");
					return;
				}
				try {
					// 3d2. Envía el email de restablecimiento
					const resend = new Resend(env.RESEND_API_KEY);
					const result = await resend.emails.send({
						from: env.RESEND_FROM || "Tempo <noreply@mgdc.site>",
						to: user.email,
						subject: "Restablece tu contraseña / Reset your password",
						text: `${url}`,
					});
					console.log("[Auth] Reset email sent to", user.email, result);
				} catch (error) {
					console.error("[Auth] Error sending reset email:", error);
				}
			},
			// 3e. Hash y verificación mediante servicio externo
			password: {
				hash: async (password) => {
					// 3e1. Valida longitud mínima de 8 caracteres
					if (password.length < 8) {
						throw new Error("La contraseña debe tener al menos 8 caracteres");
					}
					// 3e2. Verifica que el servicio de hash esté disponible
					const healthy = await checkHashService(env?.HASH_SERVICE_URL || "");
					if (!healthy) {
						throw new Error("Servicio de autenticación no disponible");
					}
					// 3e3. Envía la contraseña al servicio externo para hashear
					const response = await fetchWithTimeout(
						`${env?.HASH_SERVICE_URL}/hash`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"x-api-key": env?.HASH_SERVICE_API_KEY || "",
							},
							body: JSON.stringify({ password }),
						},
					);

					const jsonRes: HashResponse = await response.json();
					return jsonRes.data.hash;
				},
				verify: async ({ hash, password }) => {
					// 3e4. Verifica disponibilidad del servicio
					const healthy = await checkHashService(env?.HASH_SERVICE_URL || "");
					if (!healthy) {
						throw new Error("Servicio de autenticación no disponible");
					}
					// 3e5. Envía contraseña y hash para verificar coincidencia
					const response = await fetchWithTimeout(
						`${env?.HASH_SERVICE_URL}/verify`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"x-api-key": env?.HASH_SERVICE_API_KEY || "",
							},
							body: JSON.stringify({ password, hash }),
						},
					);
					const jsonRes: VerifyResponse = await response.json();
					return jsonRes.data.match;
				},
			},
		},

		// 3f. Verificación de email con Resend
		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: false,
			sendOnSignIn: true,
			sendVerificationEmail: async ({ user, url, token: _token }, _request) => {
				console.log("[Auth] sendVerificationEmail CALLED for", user?.email);
				// 3f1. Verifica RESEND_API_KEY
				if (!env?.RESEND_API_KEY) {
					console.error("[Auth] RESEND_API_KEY no configurada");
					return;
				}
				try {
					// 3f2. Envía email de verificación vía Resend
					const resend = new Resend(env.RESEND_API_KEY);
					const result = await resend.emails.send({
						from: env.RESEND_FROM || "Tempo <noreply@mgdc.site>",
						to: user.email,
						subject: "Verifica tu correo / Verify your email",
						text: `${url}`,
					});
					console.log("[Auth] Verification email sent to", user.email, result);
				} catch (error) {
					console.error("[Auth] Error sending verification email:", error);
				}
			},
		},

		trustedOrigins: ["http://localhost:4321", "https://tempo.mgdc.site"],

		// 3g. Captcha con Cloudflare Turnstile
		plugins: [
			captcha({
				provider: "cloudflare-turnstile",
				secretKey: env?.TURNSTILE_SECRET_KEY || "",
			}),
		],
	});

	return authInstance;
};
