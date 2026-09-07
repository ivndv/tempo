// Tests unitarios de sincronización local → nube (ADR-001)
// Cubre traducirTareaId, persistencia de mapas, fallbacks, idempotencia y deduplicación.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cargarMapaIds,
	crearTareaEnNube,
	guardarMapaIds,
	subirBreak,
	subirPomodoro,
	traducirTareaId,
} from "../../src/lib/sync/sync";
import { syncLocalToCloud } from "../../src/lib/sync/syncLocalToCloud";
import { useStore } from "../../src/stores/store";
import { jsonOk, mockFetch, sesionPrueba } from "./helpers";

const UMBRAL = 1_000_000_000_000;

describe("sync.ts — traducirTareaId y primitivas de sync", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
	});

	describe("cargarMapaIds y guardarMapaIds", () => {
		it("devuelve objeto vacío si no hay mapa en localStorage", () => {
			expect(cargarMapaIds()).toEqual({});
		});

		it("persiste y recupera el mapa correctamente", () => {
			guardarMapaIds({ 1720000000000: 42, 1720000000001: 43 });
			expect(cargarMapaIds()).toEqual({
				1720000000000: 42,
				1720000000001: 43,
			});
		});

		it("maneja JSON corrupto limpiando localStorage y devolviendo {}", () => {
			localStorage.setItem("tempo_id_map", "not-a-valid-json{");
			expect(cargarMapaIds()).toEqual({});
			expect(localStorage.getItem("tempo_id_map")).toBeNull();
		});
	});

	describe("crearTareaEnNube", () => {
		it("crea tarea en la API y devuelve el ID real autoincremental", async () => {
			const fetchFn = mockFetch((url, init) => {
				if (url === "/api/tareas" && init?.method === "POST") {
					return jsonOk({ id: 101, nombre: "Test Tarea" });
				}
				return jsonOk(null);
			});

			const id = await crearTareaEnNube("Test Tarea");
			expect(id).toBe(101);
			expect(fetchFn).toHaveBeenCalledWith(
				"/api/tareas",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ nombre: "Test Tarea" }),
				}),
			);
		});

		it("usa FALLBACK_NOMBRE ('Tarea') si se le pasa nombre vacío", async () => {
			const fetchFn = mockFetch((url, init) => {
				if (url === "/api/tareas" && init?.method === "POST") {
					return jsonOk({ id: 102, nombre: "Tarea" });
				}
				return jsonOk(null);
			});

			const id = await crearTareaEnNube("");
			expect(id).toBe(102);
			expect(fetchFn).toHaveBeenCalledWith(
				"/api/tareas",
				expect.objectContaining({
					body: JSON.stringify({ nombre: "Tarea" }),
				}),
			);
		});

		it("devuelve null si la API responde con error", async () => {
			mockFetch(() => new Response("error", { status: 500 }));
			const id = await crearTareaEnNube("Falla");
			expect(id).toBeNull();
		});

		it("devuelve null si fetch lanza excepción de red", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn(async () => {
					throw new Error("Network error");
				}),
			);
			const id = await crearTareaEnNube("Falla Red");
			expect(id).toBeNull();
		});
	});

	describe("traducirTareaId", () => {
		it("devuelve null inmediatamente si tareaId es null sin llamar a fetch", async () => {
			const fetchFn = mockFetch(() => jsonOk(null));
			const res = await traducirTareaId({
				tareaId: null,
				tareasNube: [{ id: 1 }, { id: 2 }],
				getNombre: () => "Algo",
			});
			expect(res).toBeNull();
			expect(fetchFn).not.toHaveBeenCalled();
		});

		it("mapa hit: devuelve el id real existente en tempo_id_map sin llamar a fetch", async () => {
			const fetchFn = mockFetch(() => jsonOk(null));
			const idLocal = UMBRAL + 10;
			guardarMapaIds({ [idLocal]: 55 });

			const res = await traducirTareaId({
				tareaId: idLocal,
				tareasNube: [],
				getNombre: () => "Cualquiera",
			});

			expect(res).toBe(55);
			expect(fetchFn).not.toHaveBeenCalled();
		});

		it("tareasNube hit: si el id ya está en las tareas de la nube, lo devuelve directo sin fetch", async () => {
			const fetchFn = mockFetch(() => jsonOk(null));
			const idReal = 77;

			const res = await traducirTareaId({
				tareaId: idReal,
				tareasNube: [{ id: 10 }, { id: 77 }, { id: 90 }],
				getNombre: () => "Cualquiera",
			});

			expect(res).toBe(77);
			expect(fetchFn).not.toHaveBeenCalled();
		});

		it("creación al vuelo: crea la tarea en la nube, persiste en el mapa y devuelve el nuevo ID", async () => {
			const idLocal = UMBRAL + 99;
			mockFetch((url, init) => {
				if (url === "/api/tareas" && init?.method === "POST") {
					return jsonOk({ id: 200, nombre: "Tarea Nueva" });
				}
				return jsonOk(null);
			});

			const res = await traducirTareaId({
				tareaId: idLocal,
				tareasNube: [],
				getNombre: () => "Tarea Nueva",
			});

			expect(res).toBe(200);
			const mapa = cargarMapaIds();
			expect(mapa[idLocal]).toBe(200);
		});

		it("devuelve null si la creación al vuelo falla", async () => {
			mockFetch(() => new Response("error", { status: 400 }));
			const idLocal = UMBRAL + 50;

			const res = await traducirTareaId({
				tareaId: idLocal,
				tareasNube: [],
				getNombre: () => "Falla",
			});

			expect(res).toBeNull();
			const mapa = cargarMapaIds();
			expect(mapa[idLocal]).toBeUndefined();
		});
	});

	describe("subirPomodoro y subirBreak", () => {
		it("subirPomodoro envía el payload esperado y devuelve true si ok", async () => {
			const fetchFn = mockFetch(() => jsonOk({ success: true }));
			const ok = await subirPomodoro({
				tareaId: 10,
				status: "completed",
				minutesActual: 25,
				createdAt: 1720000000000,
			});
			expect(ok).toBe(true);
			expect(fetchFn).toHaveBeenCalledWith(
				"/api/pomodoros",
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("subirBreak envía el payload esperado y devuelve true si ok", async () => {
			const fetchFn = mockFetch(() => jsonOk({ success: true }));
			const ok = await subirBreak({
				tipo: "short",
				status: "completed",
				minutesActual: 5,
				createdAt: 1720000000000,
			});
			expect(ok).toBe(true);
			expect(fetchFn).toHaveBeenCalledWith(
				"/api/breaks",
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("devuelve false si fetch falla", async () => {
			mockFetch(() => new Response("err", { status: 500 }));
			const okPom = await subirPomodoro({
				tareaId: 1,
				status: "completed",
				minutesActual: 25,
				createdAt: 1,
			});
			const okBreak = await subirBreak({
				tipo: "short",
				status: "completed",
				minutesActual: 5,
				createdAt: 1,
			});
			expect(okPom).toBe(false);
			expect(okBreak).toBe(false);
		});
	});
});

describe("syncLocalToCloud.ts — orquestación, idempotencia y deduplicación", () => {
	beforeEach(() => {
		localStorage.clear();
		useStore.setState({
			isLoggedIn: false,
			user: null,
			tareas: [],
			history: [],
			breakHistory: [],
			tareasPendientes: {},
			pomodoroActivo: null,
		});
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
	});

	it("no ejecuta sync si el usuario no está logueado", async () => {
		const fetchFn = mockFetch(() => jsonOk(null));
		localStorage.setItem(
			"tempo_tareas",
			JSON.stringify([{ id: UMBRAL + 1, nombre: "Offline" }]),
		);

		await syncLocalToCloud();
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it("idempotencia: tareas locales que ya tienen id real (< 1e12) se sanean a synced:true y no se re-suben", async () => {
		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			tareas: [
				{
					id: 5,
					nombre: "Existente en Nube",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});

		const fetchFn = mockFetch(() => jsonOk(null));

		// Tarea local con id real (subida en un sync previo pero sin flag synced)
		localStorage.setItem(
			"tempo_tareas",
			JSON.stringify([{ id: 5, nombre: "Existente en Nube", synced: false }]),
		);

		await syncLocalToCloud();

		// No debe llamar a /api/tareas para re-crearla
		expect(fetchFn).not.toHaveBeenCalled();

		// Y el localStorage queda saneado con synced: true
		const guardadas = JSON.parse(localStorage.getItem("tempo_tareas") ?? "[]");
		expect(guardadas[0].synced).toBe(true);
	});

	it("poda del mapa: elimina claves residuales < 1e12 de tempo_id_map", async () => {
		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
		});

		mockFetch(() => jsonOk(null));

		// Mapa con una clave inválida (< 1e12) y una válida (>= 1e12)
		guardarMapaIds({
			5: 5, // residuo de bug anterior
			[UMBRAL + 1]: 10,
		});

		await syncLocalToCloud();

		const mapa = cargarMapaIds();
		expect(mapa[5]).toBeUndefined();
		expect(mapa[UMBRAL + 1]).toBe(10);
	});

	it("sube tareas offline (id >= 1e12), actualiza el store y persiste synced:true", async () => {
		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			tareas: [],
		});

		const idLocal = UMBRAL + 50;
		localStorage.setItem(
			"tempo_tareas",
			JSON.stringify([
				{
					id: idLocal,
					nombre: "Pendiente de subir",
					categoriaId: null,
					estado: "pending",
					createdAt: 1000,
					completedAt: null,
				},
			]),
		);

		mockFetch((url, init) => {
			if (url === "/api/tareas" && init?.method === "POST") {
				return jsonOk({ id: 88, nombre: "Pendiente de subir" });
			}
			return jsonOk(null);
		});

		await syncLocalToCloud();

		// El store ahora tiene la tarea con su ID real
		const storeTareas = useStore.getState().tareas;
		expect(storeTareas).toHaveLength(1);
		expect(storeTareas[0].id).toBe(88);

		// localStorage ahora tiene la tarea con synced: true y su ID real
		const localTareas = JSON.parse(
			localStorage.getItem("tempo_tareas") ?? "[]",
		);
		expect(localTareas[0].id).toBe(88);
		expect(localTareas[0].synced).toBe(true);
	});

	it("re-sync idempotente: llamar syncLocalToCloud dos veces consecutivas no duplica tareas", async () => {
		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			tareas: [],
		});

		const idLocal = UMBRAL + 123;
		localStorage.setItem(
			"tempo_tareas",
			JSON.stringify([
				{
					id: idLocal,
					nombre: "Solo una vez",
					categoriaId: null,
					estado: "pending",
					createdAt: 1000,
					completedAt: null,
				},
			]),
		);

		let postCount = 0;
		mockFetch((url, init) => {
			if (url === "/api/tareas" && init?.method === "POST") {
				postCount++;
				return jsonOk({ id: 99, nombre: "Solo una vez" });
			}
			return jsonOk(null);
		});

		// Primer sync
		await syncLocalToCloud();
		expect(postCount).toBe(1);
		expect(useStore.getState().tareas).toHaveLength(1);

		// Segundo sync inmediato
		await syncLocalToCloud();
		expect(postCount).toBe(1); // No vuelve a llamar a POST
		expect(useStore.getState().tareas).toHaveLength(1); // No duplica en el store
	});

	it("traduce las claves de tareasPendientes cuando hay IDs locales mapeados", async () => {
		const idLocal = UMBRAL + 7;
		guardarMapaIds({ [idLocal]: 33 });

		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			tareasPendientes: {
				[idLocal]: 1500, // 25 min restantes en tarea local
			},
		});

		mockFetch(() => jsonOk(null));

		await syncLocalToCloud();

		const pendientes = useStore.getState().tareasPendientes;
		expect(pendientes[33]).toBe(1500);
		expect(pendientes[idLocal]).toBeUndefined();
	});

	it("traduce el tareaId de la sesión activa de pomodoro si está mapeado", async () => {
		const idLocal = UMBRAL + 88;
		guardarMapaIds({ [idLocal]: 44 });

		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			pomodoroActivo: {
				tareaId: idLocal,
				status: "active",
				minutesPlanned: 25,
				startedAt: Date.now(),
			},
		});

		mockFetch(() => jsonOk(null));

		await syncLocalToCloud();

		const activo = useStore.getState().pomodoroActivo;
		expect(activo?.tareaId).toBe(44);
	});

	it("sube pomodoros y breaks no sincronizados y los marca synced:true de forma idempotente", async () => {
		useStore.setState({
			isLoggedIn: true,
			user: sesionPrueba.user,
			tareas: [
				{
					id: 10,
					nombre: "Tarea 10",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
			history: [
				{
					id: 1,
					type: "focus",
					tareaId: 10,
					tareaNombre: "Tarea 10",
					minutes: 25,
					endTime: "2026-09-07T12:00:00Z",
					status: "completed",
					synced: false,
				},
			],
			breakHistory: [
				{
					id: 2,
					type: "short",
					minutes: 5,
					endTime: "2026-09-07T12:05:00Z",
					status: "completed",
					synced: false,
				},
			],
		});

		localStorage.setItem(
			"pomodoro_history",
			JSON.stringify(useStore.getState().history),
		);
		localStorage.setItem(
			"break_history",
			JSON.stringify(useStore.getState().breakHistory),
		);

		let pomodorosSubidos = 0;
		let breaksSubidos = 0;

		mockFetch((url, init) => {
			if (url === "/api/pomodoros" && init?.method === "POST") {
				pomodorosSubidos++;
				return jsonOk({ success: true });
			}
			if (url === "/api/breaks" && init?.method === "POST") {
				breaksSubidos++;
				return jsonOk({ success: true });
			}
			return jsonOk(null);
		});

		// Primer sync
		await syncLocalToCloud();

		expect(pomodorosSubidos).toBe(1);
		expect(breaksSubidos).toBe(1);
		expect(useStore.getState().history[0].synced).toBe(true);
		expect(useStore.getState().breakHistory[0].synced).toBe(true);

		// Segundo sync (idempotente)
		await syncLocalToCloud();

		expect(pomodorosSubidos).toBe(1); // No re-sube
		expect(breaksSubidos).toBe(1); // No re-sube
	});
});
