// i18n
import { defaultLang, ui } from "./ui";

// Retorna una función de traducción para el idioma dado
export function useTranslations(lang: keyof typeof ui) {
	// Busca la clave en el idioma actual, fallback al idioma por defecto
	return function t(
		key: keyof (typeof ui)[typeof defaultLang],
		vars?: Record<string, string | number>,
	) {
		let str = ui[lang][key] || ui[defaultLang][key];
		// Reemplaza variables en formato {key} con valores reales
		if (vars) {
			for (const [k, v] of Object.entries(vars)) {
				str = str.replace(`{${k}}`, String(v));
			}
		}
		return str;
	};
}
