// Sincronización local → nube (ADR-001)
// Flujo: tareas offline → pomodoros → breaks (idempotente)

import type { BreakLogEntry } from "../../stores/slices/breakSlice";
import type { LogEntry } from "../../stores/slices/pomodoroSlice";
import { useStore } from "../../stores/store";
import type { TareaResponse } from "../shared/validations";
import {
	cargarMapaIds,
	guardarMapaIds,
	subirBreak,
	subirPomodoro,
	traducirTareaId,
} from "./sync";

const TAREAS_KEY = "tempo_tareas";

// Tarea local con flag de sincronización
type TareaLocal = TareaResponse & { synced?: boolean };

// Umbral: IDs generados offline son >= 1e12, IDs reales de D1 son menores
const UMBRAL_ID_REAL = 1_000_000_000_000;

// Lee tareas offline desde localStorage
const cargarTareasLocales = (): TareaLocal[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem(TAREAS_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

// Guarda tareas offline en localStorage
const persistirTareasLocales = (tareas: TareaLocal[]) => {
	try {
		localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
	} catch {}
};

// Marca sincronizadas las tareas locales que ya tienen ID real
const sanearTareasLocales = (locales: TareaLocal[]): TareaLocal[] => {
	const saneadas = locales.map((t) =>
		t.id >= UMBRAL_ID_REAL ? t : { ...t, synced: true },
	);
	persistirTareasLocales(saneadas);
	return saneadas;
};

// Sincroniza tareas offline y traduce referencias locales
const syncTareasLocales = async (): Promise<void> => {
	const { tareas, setTareas } = useStore.getState();
	const mapa = cargarMapaIds();

	// 1. Poda IDs reales residuales del mapa
	for (const k of Object.keys(mapa).map(Number)) {
		if (k < UMBRAL_ID_REAL) delete mapa[k];
	}
	guardarMapaIds(mapa);

	// 2. Procesa y sube tareas locales pendientes
	let locales = cargarTareasLocales();
	if (locales.length > 0) {
		locales = sanearTareasLocales(locales);

		const porSubir = locales.filter(
			(t) => !t.synced && mapa[t.id] === undefined && t.id >= UMBRAL_ID_REAL,
		);

		if (porSubir.length > 0) {
			const traducidas: TareaLocal[] = [];
			for (const t of porSubir) {
				const idReal = await traducirTareaId({
					tareaId: t.id,
					tareasNube: tareas.filter((x) => x.id < UMBRAL_ID_REAL),
					getNombre: () => t.nombre,
				});
				if (idReal === null) {
					traducidas.push(t);
					continue;
				}
				mapa[t.id] = idReal;
				traducidas.push({ ...t, id: idReal, synced: true });
			}
			guardarMapaIds(mapa);
			persistirTareasLocales(traducidas);

			// 3. Integra tareas nuevas al store sustituyendo las locales
			const nuevas = traducidas
				.filter((t) => t.synced)
				.map(({ synced: _synced, ...t }) => t);
			if (nuevas.length > 0) {
				const tareasReales = tareas.filter((x) => x.id < UMBRAL_ID_REAL);
				setTareas([
					...nuevas,
					...tareasReales.filter((x) => !nuevas.some((n) => n.id === x.id)),
				]);
			}
		}
	}

	// 4. Traduce claves locales en tareasPendientes (tiempo restante)
	const { tareasPendientes, setTareasPendientes } = useStore.getState();
	const claves = Object.keys(tareasPendientes).map(Number);
	const tieneClavesLocales = claves.some(
		(k) => mapa[k] !== undefined && k !== mapa[k],
	);
	if (tieneClavesLocales) {
		const traducido: Record<number, number> = {};
		for (const k of claves) {
			const real = mapa[k];
			traducido[real ?? k] = tareasPendientes[k];
		}
		setTareasPendientes(traducido);
		guardarMapaIds(mapa);
	}

	// 5. Traduce tareaId en la sesión activa si está en curso
	const { pomodoroActivo } = useStore.getState();
	if (pomodoroActivo && mapa[pomodoroActivo.tareaId] !== undefined) {
		useStore.getState().traducirSesionActiva(mapa[pomodoroActivo.tareaId]);
	}
};

// Lee historial de pomodoros desde localStorage
const cargarHistorialPomodoro = (): LogEntry[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem("pomodoro_history");
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

// Guarda historial de pomodoros (máximo 200)
const persistirHistorialPomodoro = (history: LogEntry[]) => {
	try {
		localStorage.setItem(
			"pomodoro_history",
			JSON.stringify(history.slice(-200)),
		);
	} catch {}
};

// Marca un pomodoro como sincronizado en localStorage y store
const marcarPomodoroSynced = (id: number) => {
	const local = cargarHistorialPomodoro().map((e) =>
		e.id === id ? { ...e, synced: true } : e,
	);
	persistirHistorialPomodoro(local);
	const { history, setHistory } = useStore.getState();
	setHistory(history.map((e) => (e.id === id ? { ...e, synced: true } : e)));
};

// Lee historial de breaks desde localStorage
const cargarHistorialBreak = (): BreakLogEntry[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem("break_history");
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

// Guarda historial de breaks (máximo 200)
const persistirHistorialBreak = (history: BreakLogEntry[]) => {
	try {
		localStorage.setItem("break_history", JSON.stringify(history.slice(-200)));
	} catch {}
};

// Marca un break como sincronizado en localStorage y store
const marcarBreakSynced = (id: number) => {
	const local = cargarHistorialBreak().map((b) =>
		b.id === id ? { ...b, synced: true } : b,
	);
	persistirHistorialBreak(local);
	const { breakHistory, setBreakHistory } = useStore.getState();
	setBreakHistory(
		breakHistory.map((b) => (b.id === id ? { ...b, synced: true } : b)),
	);
};

// Sube pomodoros locales no sincronizados
const syncPomodoros = async (): Promise<void> => {
	const { tareas, isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	// 1. Filtra pomodoros de foco pendientes de sync
	const local = cargarHistorialPomodoro();
	const porSubir = local.filter(
		(e: LogEntry) => e.type === "focus" && !e.synced,
	);
	if (porSubir.length === 0) return;

	// 2. Traduce tareaId o crea tarea fallback si no existe
	for (const e of porSubir) {
		const tareaId = await traducirTareaId({
			tareaId: e.tareaId ?? null,
			tareasNube: tareas,
			getNombre: (id) =>
				useStore.getState().tareas.find((t) => t.id === id)?.nombre ??
				e.tareaNombre,
		});
		const idFinal = tareaId ?? (await crearTareaFallback(e));
		if (idFinal === null) continue;

		// 3. Registra en la API y marca como sincronizado
		const ok = await subirPomodoro({
			tareaId: idFinal,
			status: e.status ?? "completed",
			minutesActual: e.minutes,
			createdAt: new Date(e.endTime).getTime(),
		});
		if (ok) marcarPomodoroSynced(e.id);
	}
};

// Crea tarea de respaldo si la sesión no tiene tarea asociada
const crearTareaFallback = async (e: LogEntry): Promise<number | null> => {
	const { createTarea } = useStore.getState();
	const nombre = e.tareaNombre?.trim();
	if (!nombre) return null;
	const tarea = await createTarea(nombre);
	return tarea?.id ?? null;
};

// Sube descansos locales no sincronizados
const syncBreaks = async (): Promise<void> => {
	const { isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	// 1. Filtra breaks pendientes de sync
	const local = cargarHistorialBreak();
	const porSubir = local.filter((b: BreakLogEntry) => !b.synced);
	if (porSubir.length === 0) return;

	// 2. Registra en la API y marca como sincronizado
	for (const b of porSubir) {
		const ok = await subirBreak({
			tipo: b.tipo,
			status: b.status,
			minutesActual: b.minutes,
			createdAt: new Date(b.endTime).getTime(),
		});
		if (ok) marcarBreakSynced(b.id);
	}
};

// Notifica estado de sincronización (flag global y evento para E2E)
const setSyncFlag = (done: boolean) => {
	if (typeof window === "undefined") return;
	(window as unknown as Record<string, unknown>).__tempoSyncDone = done;
	window.dispatchEvent(
		new CustomEvent(done ? "tempo-sync-done" : "tempo-sync-start"),
	);
};

// Orquesta la sincronización completa (tareas, pomodoros y descansos)
export const syncLocalToCloud = async (): Promise<void> => {
	const { isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	// 1. Inicia sincronización y notifica evento
	setSyncFlag(false);

	// 2. Sube tareas locales y traduce referencias
	try {
		await syncTareasLocales();
	} catch (error) {
		console.error("[Sync] syncTareasLocales error:", error);
	}

	// 3. Sube historial de pomodoros
	try {
		await syncPomodoros();
	} catch (error) {
		console.error("[Sync] syncPomodoros error:", error);
	}

	// 4. Sube historial de descansos
	try {
		await syncBreaks();
	} catch (error) {
		console.error("[Sync] syncBreaks error:", error);
	}

	// 5. Finaliza sincronización y notifica evento
	setSyncFlag(true);
};
