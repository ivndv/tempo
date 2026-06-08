// Tipos de descanso y sus estados
export type BreakType = "short" | "long";
export type BreakStatus = "active" | "completed" | "skipped";

// Datos del descanso activo en memoria
interface BreakActivo {
	tipo: BreakType;
	status: "active";
	minutesPlanned: number;
	startedAt: number;
}

// Clave para persistir en localStorage
const STORAGE_KEY = "break_active_session";

// Slice de gestión de descansos (cortos y largos)
export interface BreakSlice {
	breakActivo: BreakActivo | null;

	iniciarBreak: (tipo?: BreakType) => void;
	completarBreak: (isLoggedIn: boolean) => Promise<void>;
	saltarBreak: (isLoggedIn: boolean) => Promise<void>;
	resetBreak: () => void;
}

// Crea el slice de descansos
export const crearSliceBreaks = (
	set: (
		partial: Partial<BreakSlice> | ((state: BreakSlice) => Partial<BreakSlice>),
	) => void,
	get: () => BreakSlice,
): BreakSlice => ({
	breakActivo: null,

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
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(breakData));
		} catch {}
		set({ breakActivo: breakData });
	},

	completarBreak: async (isLoggedIn) => {
		const { breakActivo } = get();
		if (!breakActivo) return;

		// 1. Si está autenticado, registra en la API
		if (isLoggedIn) {
			try {
				await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "completed",
						minutesActual: breakActivo.minutesPlanned,
					}),
				});
			} catch (error) {
				console.error("[BreakStore] completar error:", error);
				(get() as any).addToast?.("Error al registrar descanso", "error");
			}
		}
		// 2. Limpia localStorage y store
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},

	saltarBreak: async (isLoggedIn) => {
		const { breakActivo } = get();
		if (!breakActivo) return;

		// 1. Calcula tiempo transcurrido
		const elapsed = Math.round((Date.now() - breakActivo.startedAt) / 60000);

		// 2. Si está autenticado, registra como saltado
		if (isLoggedIn) {
			try {
				await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "skipped",
						minutesActual: Math.max(elapsed, 0),
					}),
				});
			} catch (error) {
				console.error("[BreakStore] saltar error:", error);
				(get() as any).addToast?.("Error al saltar descanso", "error");
			}
		}
		// 3. Limpia localStorage y store
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},

	resetBreak: () => {
		// 1. Limpia localStorage y store
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},
});
