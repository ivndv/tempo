// Tests unitarios para el middleware de persistencia y safeStorage
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	appendToPersistedHistory,
	persistKeys,
	safeStorage,
} from "../../src/stores/storage";

describe("persist — safeStorage y persistKeys", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		if (typeof localStorage !== "undefined") {
			localStorage.clear();
		}
	});

	it("define las claves canónicas esperadas", () => {
		expect(persistKeys.TAREAS).toBe("tempo_tareas");
		expect(persistKeys.POMODORO_ACTIVE).toBe("pomodoro_active_session");
		expect(persistKeys.POMODORO_HISTORY).toBe("pomodoro_history");
		expect(persistKeys.POMODORO_REMAINING).toBe("pomodoro_remaining");
		expect(persistKeys.BREAK_ACTIVE).toBe("break_active_session");
		expect(persistKeys.BREAK_HISTORY).toBe("break_history");
		expect(persistKeys.MAP_IDS).toBe("tempo_id_map");
		expect(persistKeys.THEME).toBe("theme");
	});

	it("get devuelve null si no existe la clave y no hay fallback", () => {
		expect(safeStorage.get("inexistente")).toBeNull();
	});

	it("get devuelve el fallback si no existe la clave", () => {
		expect(safeStorage.get("inexistente", { valor: 42 })).toEqual({
			valor: 42,
		});
	});

	it("set y get guardan y recuperan estructuras JSON correctamente", () => {
		const datos = { id: 1, items: ["a", "b"] };
		safeStorage.set("clave_prueba", datos);
		expect(safeStorage.get("clave_prueba")).toEqual(datos);
	});

	it("get limpia la clave corrupta en localStorage y retorna fallback", () => {
		localStorage.setItem("corrupto", "{ esto-no-es-json");
		const res = safeStorage.get("corrupto", []);
		expect(res).toEqual([]);
		expect(localStorage.getItem("corrupto")).toBeNull();
	});

	it("remove elimina la clave de localStorage", () => {
		safeStorage.set("por_borrar", "hola");
		expect(localStorage.getItem("por_borrar")).not.toBeNull();
		safeStorage.remove("por_borrar");
		expect(localStorage.getItem("por_borrar")).toBeNull();
	});

	it("getString y setString manipulan cadenas sin JSON.parse", () => {
		safeStorage.setString(persistKeys.THEME, "business");
		expect(safeStorage.getString(persistKeys.THEME)).toBe("business");
		expect(localStorage.getItem(persistKeys.THEME)).toBe("business");
	});

	it("appendToPersistedHistory acumula y corta en el límite máximo", () => {
		appendToPersistedHistory("hist", { val: 1 }, 2);
		appendToPersistedHistory("hist", { val: 2 }, 2);
		const resultado = appendToPersistedHistory("hist", { val: 3 }, 2);

		expect(resultado).toEqual([{ val: 2 }, { val: 3 }]);
		expect(safeStorage.get("hist")).toEqual([{ val: 2 }, { val: 3 }]);
	});

	it("funciona de forma segura si localStorage es undefined (SSR)", () => {
		vi.stubGlobal("localStorage", undefined);
		expect(safeStorage.get("clave", "def")).toBe("def");
		expect(safeStorage.getString("clave", "def")).toBe("def");
		expect(() => safeStorage.set("clave", { a: 1 })).not.toThrow();
		expect(() => safeStorage.setString("clave", "val")).not.toThrow();
		expect(() => safeStorage.remove("clave")).not.toThrow();
	});
});
