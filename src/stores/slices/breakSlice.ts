import { appendToPersistedHistory, persistKeys, safeStorage } from "../storage";
import type { AppState } from "../store";

export type BreakType = "short" | "long";
export type BreakStatus = "active" | "completed" | "skipped";

// Entrada del historial local de descansos (para sync → nube)
export interface BreakLogEntry {
	id: number;
	tipo: BreakType;
	status: "completed" | "skipped";
	minutes: number;
	startTime: string;
	endTime: string;
	// true = ya registrado en la nube (no se vuelve a subir)
	synced?: boolean;
}

// Datos del descanso activo en memoria
interface BreakActivo {
	tipo: BreakType;
	status: "active";
	minutesPlanned: number;
	startedAt: number;
}

// Slice de gestión de descansos (cortos y largos)
export interface BreakSlice {
	breakActivo: BreakActivo | null;
	breakHistory: BreakLogEntry[];

	iniciarBreak: (tipo?: BreakType) => void;
	completarBreak: () => Promise<void>;
	saltarBreak: () => Promise<void>;
	resetBreak: () => void;
	// Helpers usados por el sync (src/lib/syncLocalToCloud.ts)
	setBreakHistory: (history: BreakLogEntry[]) => void;
}

// Crea el slice de descansos
export const crearSliceBreaks = (
	set: (
		partial: Partial<BreakSlice> | ((state: BreakSlice) => Partial<BreakSlice>),
	) => void,
	get: () => AppState,
): BreakSlice => ({
	breakActivo: null,
	breakHistory: [],

	iniciarBreak: (tipo = "short") => {
		// 1. Calcula minutos según el tipo (5 corto, 15 largo)
		const minutesPlanned = tipo === "long" ? 15 : 5;
		const breakData: BreakActivo = {
			tipo,
			status: "active",
			minutesPlanned,
			startedAt: Date.now(),
		};
		// 2. Persiste en localStorage y actualiza store
		safeStorage.set(persistKeys.BREAK_ACTIVE, breakData);
		set({ breakActivo: breakData });
	},

	completarBreak: async () => {
		const { breakActivo, isLoggedIn } = get();
		if (!breakActivo) return;

		// 1. Si está autenticado, registra en la API
		let synced = false;
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "completed",
						minutesActual: breakActivo.minutesPlanned,
					}),
				});
				synced = res.ok;
			} catch (error) {
				console.error("[BreakStore] completar error:", error);
				get().addToast("Error al registrar descanso", "error");
			}
		}
		// 2. Guarda en historial local (siempre) y limpia la sesión activa
		guardarBreakLocal(
			set,
			breakActivo.tipo,
			"completed",
			breakActivo.minutesPlanned,
			synced,
		);
		safeStorage.remove(persistKeys.BREAK_ACTIVE);
		set({ breakActivo: null });
	},

	saltarBreak: async () => {
		const { breakActivo, isLoggedIn } = get();
		if (!breakActivo) return;

		// 1. Calcula tiempo transcurrido
		const elapsed = Math.round((Date.now() - breakActivo.startedAt) / 60000);

		// 2. Si está autenticado, registra como saltado
		let synced = false;
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "skipped",
						minutesActual: Math.max(elapsed, 0),
					}),
				});
				synced = res.ok;
			} catch (error) {
				console.error("[BreakStore] saltar error:", error);
				get().addToast("Error al saltar descanso", "error");
			}
		}
		// 3. Guarda en historial local (siempre) y limpia la sesión activa
		guardarBreakLocal(
			set,
			breakActivo.tipo,
			"skipped",
			Math.max(elapsed, 0),
			synced,
		);
		safeStorage.remove(persistKeys.BREAK_ACTIVE);
		set({ breakActivo: null });
	},

	resetBreak: () => {
		// 1. Limpia localStorage y store
		safeStorage.remove(persistKeys.BREAK_ACTIVE);
		set({ breakActivo: null });
	},

	// Reemplaza el historial completo (usado por el sync)
	setBreakHistory: (breakHistory) => {
		set({ breakHistory });
	},
});

// Registra un descanso en el historial local (máx 200) y lo persiste
const guardarBreakLocal = (
	set: (
		partial: Partial<BreakSlice> | ((state: BreakSlice) => Partial<BreakSlice>),
	) => void,
	tipo: BreakType,
	status: "completed" | "skipped",
	minutes: number,
	synced: boolean,
) => {
	const now = new Date();
	const startTime = new Date(now.getTime() - minutes * 60000);
	const entry: BreakLogEntry = {
		id: Date.now(),
		tipo,
		status,
		minutes,
		startTime: startTime.toISOString(),
		endTime: now.toISOString(),
		synced,
	};

	set((state) => {
		const allHistory = [entry, ...state.breakHistory].slice(0, 200);
		appendToPersistedHistory(persistKeys.BREAK_HISTORY, entry, 200);
		return { breakHistory: allHistory };
	});
};
