// Resetea D1/KV local, aplica migraciones y compila para pruebas E2E
import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const D1_DIR = join(ROOT, ".wrangler", "state", "v3", "d1");
const KV_DIR = join(ROOT, ".wrangler", "state", "v3", "kv");

function run(cmd: string) {
	execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

// 1. Limpieza de estado local previo
console.log("Reseteando D1 y KV local...");
rmSync(D1_DIR, { recursive: true, force: true });
rmSync(KV_DIR, { recursive: true, force: true });

// 2. Migraciones y fixtures
console.log("Aplicando migraciones...");
run(
	"bunx wrangler d1 execute pomodoro-db --local --file=drizzle/0000_baseline.sql",
);

console.log("Sembrando fixtures E2E...");
run(
	"bunx wrangler d1 execute pomodoro-db --local --file=tests/support/fixtures.sql",
);

mkdirSync("tests/e2e/.state", { recursive: true });

// 3. Build con clave de prueba de Turnstile
console.log("Compilando con Turnstile test keys...");
execSync("bun run astro build", {
	cwd: ROOT,
	stdio: "inherit",
	env: {
		...process.env,
		PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
	},
});

console.log("D1 local lista para E2E (usuario e2e@tempo.dev)");
