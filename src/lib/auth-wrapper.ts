import type { APIContext } from "astro";

/**
 * Wrapper de autenticación para proteger páginas que requieren inicio de sesión.
 * Úsalo en páginas Astro que solo deben ser accesibles para usuarios autenticados.
 *
 * Si no hay una sesión activa, redirige automáticamente al login conservando
 * la URL original para volver después del inicio de sesión.
 *
 * @example
 * ```astro
 * ---
 * import { requireAuth } from '@/lib/auth-wrapper';
 * const session = await requireAuth(Astro);
 * // Si llegamos aquí, el usuario está autenticado y tenemos su sesión
 * ---
 * ```
 */
export async function requireAuth(context: APIContext) {
	const { request, locals, redirect } = context;

	// Verificar si existe sesión en locals (inyectada por el middleware de Better Auth)
	// El tipado está definido en src/env.d.ts
	const session = locals.session;

	if (!session) {
		// Redirigir al login capturando la ruta actual para el retorno
		const url = new URL(request.url);
		const returnTo = encodeURIComponent(url.pathname + url.search);
		return redirect(`/login?returnTo=${returnTo}`);
	}

	return session;
}

/**
 * Wrapper de autenticación opcional.
 * Obtiene la sesión si está disponible, pero no realiza ninguna redirección.
 * Útil para páginas con contenido "híbrido" (diferente según si hay login o no).
 *
 * @example
 * ```astro
 * ---
 * import { getOptionalAuth } from '@/lib/auth-wrapper';
 * const session = await getOptionalAuth(Astro);
 * // session será null si el usuario es un invitado
 * ---
 * ```
 */
export async function getOptionalAuth(context: APIContext) {
	const { locals } = context;
	// Retornamos la sesión de locals si existe, o null en su defecto
	return locals.session || null;
}
