/** @jsxImportSource react */
// React
import { useEffect } from "react";
// Autenticación
import { authClient } from "../../lib/auth-client";
// Store
import { useStore } from "../../stores/store";

// Sincroniza la sesión con el store global
export default function SessionProvider() {
	const { data: session, isPending } = authClient.useSession();
	const setUser = useStore((s) => s.setUser);

	useEffect(() => {
		if (!isPending) {
			setUser(session ?? null);
		}
	}, [session, isPending, setUser]);

	return null;
}
