/** @jsxImportSource react */
import { useEffect } from "react";
import { authClient } from "../lib/auth-client";
import { useStore } from "../stores/store";

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
