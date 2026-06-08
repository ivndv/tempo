// Estado del tema e idioma de la app
export interface SettingsSlice {
	theme: string;
	lang: "es" | "en";
	setTheme: (theme: string) => void;
	setLang: (lang: "es" | "en") => void;
}

// Obtiene el tema inicial desde localStorage o usa el valor por defecto
const getInitialTheme = (): string => {
	if (typeof localStorage === "undefined") return "business";
	try {
		const saved = localStorage.getItem("theme");
		if (saved) return saved;
	} catch {}
	return "business";
};

// Crea el slice de configuración (tema e idioma)
export const crearSliceSettings = (
	set: (
		partial:
			| Partial<SettingsSlice>
			| ((state: SettingsSlice) => Partial<SettingsSlice>),
	) => void,
): SettingsSlice => ({
	theme: getInitialTheme(),
	lang: "es",

	// Cambia el tema y lo persiste en localStorage
	setTheme: (theme) => {
		try {
			localStorage.setItem("theme", theme);
			document.documentElement.setAttribute("data-theme", theme);
		} catch {}
		set({ theme });
	},

	// Cambia el idioma en el store
	setLang: (lang) => {
		set({ lang });
	},
});
