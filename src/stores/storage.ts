// Capa de persistencia en localStorage para slices de Zustand y sync (offline-first)

// Claves canónicas para la persistencia local de Tempo
export const persistKeys = {
	TAREAS: "tempo_tareas",
	POMODORO_ACTIVE: "pomodoro_active_session",
	POMODORO_HISTORY: "pomodoro_history",
	POMODORO_REMAINING: "pomodoro_remaining",
	BREAK_ACTIVE: "break_active_session",
	BREAK_HISTORY: "break_history",
	MAP_IDS: "tempo_id_map",
	THEME: "theme",
} as const;

export type PersistKey = (typeof persistKeys)[keyof typeof persistKeys];

// Obtiene y parsea un elemento JSON (limpia si está corrupto y soporta SSR)
function getItem<T>(key: string, fallback: T): T;
function getItem<T>(key: string): T | null;
function getItem<T>(key: string, fallback?: T): T | null {
	if (typeof localStorage === "undefined") return fallback ?? null;
	try {
		const item = localStorage.getItem(key);
		if (item === null) return fallback ?? null;
		return JSON.parse(item) as T;
	} catch {
		removeItem(key);
		return fallback ?? null;
	}
}

// Guarda un valor serializado como JSON en localStorage
function setItem<T>(key: string, value: T): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.warn(`[safeStorage] Error al persistir en clave "${key}":`, error);
	}
}

// Obtiene una cadena de texto sin procesar con JSON
function getString(key: string, fallback?: string): string | null {
	if (typeof localStorage === "undefined") return fallback ?? null;
	try {
		const item = localStorage.getItem(key);
		return item !== null ? item : (fallback ?? null);
	} catch {
		return fallback ?? null;
	}
}

// Guarda una cadena de texto sin serializar a JSON
function setString(key: string, value: string): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.warn(
			`[safeStorage] Error al persistir string en clave "${key}":`,
			error,
		);
	}
}

// Elimina una clave de localStorage de forma segura
function removeItem(key: string): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.removeItem(key);
	} catch {}
}

// Cliente de almacenamiento seguro con manejo de excepciones y compatibilidad SSR
export const safeStorage = {
	get: getItem,
	set: setItem,
	getString,
	setString,
	remove: removeItem,
};

// Añade una entrada al historial persistido limitando al máximo indicado (FIFO)
export const appendToPersistedHistory = <T>(
	key: string,
	entry: T,
	maxLimit = 200,
): T[] => {
	const existing = safeStorage.get<T[]>(key, []);
	const updated = [...existing, entry].slice(-maxLimit);
	safeStorage.set(key, updated);
	return updated;
};
