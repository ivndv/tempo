/** @jsxImportSource react */
// React
import { useEffect, useRef } from "react";
// Store
import { useStore } from "../../stores/store";
// i18n
import { useTranslations } from "../../i18n/utils";

// Verifica el parámetro "verified" en la URL al cargar y muestra un toast de éxito
export default function VerifiedHandler() {
	const addToast = useStore((s) => s.addToast);
	const t = useTranslations(useStore((s) => s.lang));
	const done = useRef(false);

	// Al montar, chequea si hay ?verified=true en la URL
	useEffect(() => {
		if (done.current) return;
		const params = new URLSearchParams(window.location.search);
		if (params.get("verified") === "true") {
			// 2a. Evita ejecutarse múltiples veces
			done.current = true;
			// 2b. Muestra toast de éxito en el idioma correspondiente
			addToast(t("auth.verified.toast"), "success", "");

			// 2c. Limpia el parámetro de la URL sin recargar
			const url = new URL(window.location.href);
			url.searchParams.delete("verified");
			window.history.replaceState({}, "", url.toString());
		}
	}, [addToast]);

	return null;
}
