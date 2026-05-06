import { createAuthClient } from "better-auth/react";

/**
 * Cliente de autenticación para el frontend (lado del cliente).
 * Se encarga de las peticiones a los endpoints de Better Auth.
 */
export const authClient = createAuthClient({
	// La URL base se ajusta dinámicamente según el origen de la ventana o usa localhost por defecto
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:4321",
});

// Exportación de métodos comunes para facilitar su uso en componentes
export const { signIn, signUp, signOut, useSession } = authClient;
