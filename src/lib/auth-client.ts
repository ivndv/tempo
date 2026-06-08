// Autenticación
import { createAuthClient } from "better-auth/react";

// Crea el cliente de Better Auth para el frontend
export const authClient = createAuthClient({
	// 1a. URL base: ventana actual o localhost por defecto
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:4321",
});

// Exporta métodos comunes para uso directo en componentes
export const { signIn, signUp, signOut, useSession } = authClient;
