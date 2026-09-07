// Pre-compila el bundle de funciones de Pages antes de los tests
import { expect, test } from "@playwright/test";

const RUTAS = [
	"/api/auth/get-session",
	"/api/tareas",
	"/api/categorias",
	"/api/pomodoros",
	"/api/pomodoros/stats",
	"/api/breaks",
];

test("warm-up: el bundle de funciones responde en todas las rutas", async ({
	request,
}) => {
	for (const ruta of RUTAS) {
		// Reintenta mientras el bundle termina de compilar
		let ultimoEstado = 0;
		for (let intento = 0; intento < 3; intento++) {
			try {
				const res = await request.get(ruta);
				ultimoEstado = res.status();
				if (ultimoEstado < 500) break;
			} catch {
				// Conexión cortada durante compilación: reintentar
			}
			await new Promise((resolver) => setTimeout(resolver, 2000));
		}
		expect(ultimoEstado).toBeLessThan(500);
	}
});
