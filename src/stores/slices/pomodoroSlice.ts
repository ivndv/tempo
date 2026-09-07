import { traducirTareaId } from "../../lib/sync/sync";
import { appendToPersistedHistory, persistKeys, safeStorage } from "../storage";
import type { AppState } from "../store";

export type SessionType = "focus" | "short" | "long";

// Estado de finalización de un pomodoro registrado localmente
export type LogStatus = "completed" | "interrupted";

// Entrada del historial de pomodoros
export interface LogEntry {
	id: number;
	type: SessionType;
	minutes: number;
	startTime: string;
	endTime: string;
	// Datos de la tarea asociada (para el sync local → nube)
	tareaId?: number;
	tareaNombre?: string;
	// Estado real de la sesión (completado o interrumpido)
	status?: LogStatus;
	// true = ya registrado en la nube (no se vuelve a subir)
	synced?: boolean;
}

// Estadísticas por día
interface DiaStat {
	day: string;
	minutes: number;
	count: number;
}

// Pomodoro activo en memoria
interface PomodoroActivo {
	tareaId: number;
	status: "active";
	minutesPlanned: number;
	startedAt: number;
}

// Carga el mapa de tiempo restante desde localStorage
const cargarRemaining = (): Record<number, number> => {
	return safeStorage.get<Record<number, number>>(
		persistKeys.POMODORO_REMAINING,
		{},
	);
};

// Guarda el mapa de tiempo restante en localStorage
const guardarRemaining = (map: Record<number, number>) => {
	safeStorage.set(persistKeys.POMODORO_REMAINING, map);
};

// Slice de gestión de pomodoros (sesiones, historial, estadísticas)
export interface PomodoroSlice {
	pomodoroActivo: PomodoroActivo | null;
	history: LogEntry[];
	weeklyStats: DiaStat[];
	cargando: boolean;
	tareasPendientes: Record<number, number>;

	iniciar: (tareaId: number) => void;
	completar: () => Promise<void>;
	interrumpir: (minutesActual: number) => Promise<void>;
	guardarLocal: (
		type: SessionType,
		minutes: number,
		extra?: {
			tareaId?: number;
			tareaNombre?: string;
			status?: LogStatus;
			synced?: boolean;
		},
	) => void;
	restaurar: () => PomodoroActivo | null;
	reset: () => void;
	init: () => Promise<void>;
	clearTareaPendiente: (taskId: number) => void;
	// Helpers usados por el sync (src/lib/syncLocalToCloud.ts)
	setHistory: (history: LogEntry[]) => void;
	setTareasPendientes: (map: Record<number, number>) => void;
	traducirSesionActiva: (tareaIdReal: number) => void;
}

// Crea el slice de pomodoros
export const crearSlicePomodoros = (
	set: (
		partial:
			| Partial<PomodoroSlice>
			| ((state: PomodoroSlice) => Partial<PomodoroSlice>),
	) => void,
	get: () => AppState,
): PomodoroSlice => ({
	pomodoroActivo: null,
	history: [],
	weeklyStats: [],
	cargando: false,
	tareasPendientes: cargarRemaining(),

	init: async () => {
		const { isLoggedIn } = get();
		// 1. Si está autenticado, carga historial desde la API
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/pomodoros");
				if (res.ok) {
					const json = await res.json();
					const history: LogEntry[] = json.data.map(
						(row: Record<string, unknown>) => ({
							id: row.id as number,
							type: "focus" as SessionType,
							minutes: row.minutesActual as number,
							startTime: new Date(
								(row.createdAt as number) -
									(row.minutesActual as number) * 60000,
							).toISOString(),
							endTime: new Date(row.createdAt as number).toISOString(),
							tareaId: row.tareaId as number,
							status: (row.status === "interrupted"
								? "interrupted"
								: "completed") as LogStatus,
							// Ya están en la nube: nunca se vuelven a subir
							synced: true,
						}),
					);
					set({ history });
				}
			} catch (error) {
				console.error("[PomodoroStore] init error:", error);
				get().addToast("Error al cargar historial", "error");
			}
		}
		// 2. Combina con historial local de localStorage
		const local = safeStorage.get<LogEntry[]>(persistKeys.POMODORO_HISTORY);
		if (local) {
			set((state) => ({
				history: state.history.length > 0 ? state.history : local,
			}));
		}
		// 3. Restaura sesión activa si existe
		get().restaurar();
	},

	iniciar: (tareaId) => {
		const { tareasPendientes } = get();
		const remainingSecs = tareasPendientes[tareaId];
		const minutesPlanned = remainingSecs ? Math.ceil(remainingSecs / 60) : 25;
		const pomodoro: PomodoroActivo = {
			tareaId,
			status: "active",
			minutesPlanned,
			startedAt: Date.now(),
		};
		safeStorage.set(persistKeys.POMODORO_ACTIVE, pomodoro);
		set({ pomodoroActivo: pomodoro });
	},

	completar: async () => {
		const { pomodoroActivo, isLoggedIn, tareas } = get();
		if (!pomodoroActivo) return;

		const minutes = pomodoroActivo.minutesPlanned;
		const tareaNombre = tareas.find(
			(t) => t.id === pomodoroActivo.tareaId,
		)?.nombre;

		// 1. Limpia tiempo pendiente de la tarea
		get().clearTareaPendiente(pomodoroActivo.tareaId);

		// 2. Si está autenticado, registra en la API (traduciendo el ID local)
		let synced = false;
		if (isLoggedIn) {
			try {
				const tareaIdReal = await traducirTareaId({
					tareaId: pomodoroActivo.tareaId,
					tareasNube: tareas,
					getNombre: (id) =>
						get().tareas.find((t) => t.id === id)?.nombre ?? tareaNombre,
				});
				const res = await fetch("/api/pomodoros", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tareaId: tareaIdReal,
						status: "completed",
						minutesActual: minutes,
					}),
				});
				synced = res.ok;
			} catch (error) {
				console.error("[PomodoroStore] completar error:", error);
				get().addToast("Error al completar pomodoro", "error");
			}
		}
		// 3. Guarda en historial local y limpia sesión activa
		get().guardarLocal("focus", minutes, {
			tareaId: pomodoroActivo.tareaId,
			tareaNombre,
			status: "completed",
			synced,
		});
		safeStorage.remove(persistKeys.POMODORO_ACTIVE);
		set({ pomodoroActivo: null });
	},

	interrumpir: async (minutesActual) => {
		const { pomodoroActivo, isLoggedIn, tareas } = get();
		if (!pomodoroActivo) return;

		const remainingSecs =
			Math.max(pomodoroActivo.minutesPlanned - minutesActual, 0) * 60;
		const tareaNombre = tareas.find(
			(t) => t.id === pomodoroActivo.tareaId,
		)?.nombre;

		// 1. Guarda tiempo restante para reanudar después
		if (remainingSecs > 0) {
			set((state) => {
				const map = {
					...state.tareasPendientes,
					[pomodoroActivo.tareaId]: remainingSecs,
				};
				guardarRemaining(map);
				return { tareasPendientes: map };
			});
		}
		// 2. Si está autenticado, registra interrupción en la API
		let synced = false;
		if (isLoggedIn) {
			try {
				const tareaIdReal = await traducirTareaId({
					tareaId: pomodoroActivo.tareaId,
					tareasNube: tareas,
					getNombre: (id) =>
						get().tareas.find((t) => t.id === id)?.nombre ?? tareaNombre,
				});
				const res = await fetch("/api/pomodoros", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tareaId: tareaIdReal,
						status: "interrupted",
						minutesActual,
					}),
				});
				synced = res.ok;
			} catch (error) {
				console.error("[PomodoroStore] interrumpir error:", error);
				get().addToast("Error al interrumpir pomodoro", "error");
			}
		}
		// 3. Guarda en historial local y limpia sesión activa
		get().guardarLocal("focus", minutesActual, {
			tareaId: pomodoroActivo.tareaId,
			tareaNombre,
			status: "interrupted",
			synced,
		});
		safeStorage.remove(persistKeys.POMODORO_ACTIVE);
		set({ pomodoroActivo: null });
	},

	guardarLocal: (type, minutes, extra) => {
		const now = new Date();
		const startTime = new Date(now.getTime() - minutes * 60000);
		const entry: LogEntry = {
			id: Date.now(),
			type,
			minutes,
			startTime: startTime.toISOString(),
			endTime: now.toISOString(),
			tareaId: extra?.tareaId,
			tareaNombre: extra?.tareaNombre,
			status: extra?.status ?? "completed",
			synced: extra?.synced ?? false,
		};

		set((state) => {
			const allHistory = [entry, ...state.history].slice(0, 200);
			appendToPersistedHistory(persistKeys.POMODORO_HISTORY, entry, 200);
			return { history: allHistory };
		});
	},

	restaurar: () => {
		const saved = safeStorage.get<PomodoroActivo>(persistKeys.POMODORO_ACTIVE);
		if (saved) {
			set({ pomodoroActivo: saved });
			return saved;
		}
		return null;
	},

	reset: () => {
		safeStorage.remove(persistKeys.POMODORO_ACTIVE);
		set({ pomodoroActivo: null });
	},

	clearTareaPendiente: (taskId) => {
		set((state) => {
			if (!(taskId in state.tareasPendientes)) return state;
			const map = { ...state.tareasPendientes };
			delete map[taskId];
			guardarRemaining(map);
			return { tareasPendientes: map };
		});
	},

	// Reemplaza el historial completo (usado por el sync)
	setHistory: (history) => {
		set({ history });
	},

	// Reemplaza el mapa de tiempo pendiente (usado por el sync tras traducir IDs)
	setTareasPendientes: (map) => {
		guardarRemaining(map);
		set({ tareasPendientes: map });
	},

	// Traduce el ID de la sesión activa (pomodoro en curso) al ID real de la nube
	traducirSesionActiva: (tareaIdReal) => {
		const { pomodoroActivo } = get();
		if (!pomodoroActivo) return;
		const traducido = { ...pomodoroActivo, tareaId: tareaIdReal };
		safeStorage.set(persistKeys.POMODORO_ACTIVE, traducido);
		set({ pomodoroActivo: traducido });
	},
});
