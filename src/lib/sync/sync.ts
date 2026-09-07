// Primitivas de sincronización local a nube (sin dependencias del store)

const MAP_KEY = "tempo_id_map";
const FALLBACK_NOMBRE = "Tarea";

// Carga el mapa de IDs locales a IDs de nube desde localStorage
export const cargarMapaIds = (): Record<number, number> => {
	if (typeof localStorage === "undefined") return {};
	try {
		const saved = localStorage.getItem(MAP_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch {
		localStorage.removeItem(MAP_KEY);
		return {};
	}
};

// Guarda el mapa de IDs en localStorage
export const guardarMapaIds = (map: Record<number, number>) => {
	try {
		localStorage.setItem(MAP_KEY, JSON.stringify(map));
	} catch (error) {
		console.warn("[Sync] guardarMapaIds error:", error);
	}
};

// Crea una tarea en la nube y devuelve su ID
export const crearTareaEnNube = async (
	nombre: string,
): Promise<number | null> => {
	try {
		const res = await fetch("/api/tareas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nombre: nombre || FALLBACK_NOMBRE }),
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json.data?.id as number) ?? null;
	} catch {
		return null;
	}
};

// Traduce un ID local al ID real de la nube
export const traducirTareaId = async (opts: {
	tareaId: number | null;
	tareasNube: { id: number }[];
	getNombre: (id: number) => string | undefined;
}): Promise<number | null> => {
	const { tareaId, tareasNube, getNombre } = opts;
	if (tareaId === null) return null;

	// 1. Revisa si ya fue traducido en el mapa
	const mapa = cargarMapaIds();
	if (mapa[tareaId] !== undefined) return mapa[tareaId];

	// 2. Revisa si ya es un ID real existente en la nube
	if (tareasNube.some((t) => t.id === tareaId)) return tareaId;

	// 3. Crea la tarea en la nube al vuelo y guarda el mapeo
	const nombre = getNombre(tareaId);
	const idReal = await crearTareaEnNube(nombre ?? FALLBACK_NOMBRE);
	if (idReal === null) return null;

	mapa[tareaId] = idReal;
	guardarMapaIds(mapa);
	return idReal;
};

// Registra un pomodoro en la API
export const subirPomodoro = async (opts: {
	tareaId: number;
	status: "completed" | "interrupted";
	minutesActual: number;
	createdAt: number;
}): Promise<boolean> => {
	try {
		const res = await fetch("/api/pomodoros", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(opts),
		});
		return res.ok;
	} catch {
		return false;
	}
};

// Registra un descanso en la API
export const subirBreak = async (opts: {
	tipo: "short" | "long";
	status: "completed" | "skipped";
	minutesActual: number;
	createdAt: number;
}): Promise<boolean> => {
	try {
		const res = await fetch("/api/breaks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(opts),
		});
		return res.ok;
	} catch {
		return false;
	}
};
