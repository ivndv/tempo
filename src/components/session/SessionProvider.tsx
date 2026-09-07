/** @jsxImportSource react */
// React
import { useEffect, useRef } from "react";
// Autenticación
import { authClient } from "../../lib/client/auth-client";
// Sync local → nube (ADR-001)
import { syncLocalToCloud } from "../../lib/sync/syncLocalToCloud";
// Store
import { useStore } from "../../stores/store";

// Sincroniza la sesión con el store global y dispara el sync local → nube
export default function SessionProvider() {
	const { data: session, isPending } = authClient.useSession();
	const setUser = useStore((s) => s.setUser);
	const syncedRef = useRef(false);

	useEffect(() => {
		if (isPending) return;
		if (session) {
			setUser(session ?? null);
			// Al iniciar sesión, sube el historial local (pomodoros/breaks
			// hechos offline). Idempotente; si falla, se reintenta en la
			// próxima carga de página.
			if (!syncedRef.current) {
				syncedRef.current = true;
				syncLocalToCloud()
					.catch((error) => {
						console.error("[Sync] syncLocalToCloud error:", error);
						syncedRef.current = false;
					})
					.finally(() => {
						// Asegura flag global para E2E (playwright waitForFunction)
						if (typeof window !== "undefined") {
							window.dispatchEvent(new CustomEvent("tempo-sync-done"));
						}
					});
			}
		} else {
			setUser(null);
			syncedRef.current = false;
		}
	}, [session, isPending, setUser]);

	return null;
}
