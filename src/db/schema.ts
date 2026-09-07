// Drizzle
import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";
// Constantes
import {
	ESTADOS_BREAK,
	ESTADOS_POMODORO,
	ESTADOS_TAREA,
	TIPOS_BREAK,
} from "../lib/shared/constants";

// ─── Better Auth ─────────────────────────────────────────────

// Usuarios de la aplicación
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// Sesiones de usuario
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
});

// Cuentas vinculadas (OAuth, email, etc.)
export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		accessTokenExpiresAt: integer("accessTokenExpiresAt", {
			mode: "timestamp",
		}),
		refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
			mode: "timestamp",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	},
	(t) => [unique("account_provider_unique").on(t.accountId, t.providerId)],
);

// Verificaciones de email
export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── App ─────────────────────────────────────────────────────

// Categorías para clasificar tareas (Trabajo, Estudio, Personal)
export const categoria = sqliteTable(
	"categoria",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		nombre: text("nombre").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
	},
	(t) => [index("idx_categoria_user_id").on(t.userId)],
);

// Tareas del usuario con estado y categoría opcional
export const tarea = sqliteTable(
	"tarea",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		nombre: text("nombre").notNull(),
		categoriaId: integer("categoria_id").references(() => categoria.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		estado: text("estado", {
			enum: [...ESTADOS_TAREA],
		})
			.notNull()
			.default("pending"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		completedAt: integer("completed_at", { mode: "timestamp" }),
	},
	(t) => [
		index("idx_tarea_usuario_fecha").on(t.userId, t.createdAt),
		index("idx_tarea_estado").on(t.estado),
		check(
			"tarea_estado_check",
			sql`${t.estado} IN ('pending', 'in_progress', 'done', 'abandoned')`,
		),
	],
);

// Sesiones de pomodoro registradas por tarea
export const pomodoro = sqliteTable(
	"pomodoro",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		tareaId: integer("tarea_id")
			.notNull()
			.references(() => tarea.id),
		status: text("status", {
			enum: [...ESTADOS_POMODORO],
		}).notNull(),
		minutesPlanned: integer("minutes_planned").notNull().default(25),
		minutesActual: integer("minutes_actual"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(t) => [
		index("idx_pomodoro_tarea_fecha").on(t.tareaId, t.createdAt),
		index("idx_pomodoro_status").on(t.status),
		check(
			"pomodoro_status_check",
			sql`${t.status} IN ('active', 'completed', 'completed_early', 'interrupted')`,
		),
	],
);

// ─── Relations ──────────────────────────────────────────────

// Relaciones de categoría → usuario y tareas
export const categoriaRelations = relations(categoria, ({ one, many }) => ({
	user: one(user, {
		fields: [categoria.userId],
		references: [user.id],
	}),
	tareas: many(tarea),
}));

// Relaciones de tarea → categoría, usuario y pomodoros
export const tareaRelations = relations(tarea, ({ one, many }) => ({
	categoria: one(categoria, {
		fields: [tarea.categoriaId],
		references: [categoria.id],
	}),
	user: one(user, {
		fields: [tarea.userId],
		references: [user.id],
	}),
	pomodoros: many(pomodoro),
}));

// Relaciones de pomodoro → tarea
export const pomodoroRelations = relations(pomodoro, ({ one }) => ({
	tarea: one(tarea, {
		fields: [pomodoro.tareaId],
		references: [tarea.id],
	}),
}));

// Descansos registrados por el usuario (cortos/largos)
export const break_ = sqliteTable(
	"break",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		tipo: text("tipo", { enum: [...TIPOS_BREAK] }).notNull(),
		status: text("status", {
			enum: [...ESTADOS_BREAK],
		}).notNull(),
		minutesPlanned: integer("minutes_planned").notNull(),
		minutesActual: integer("minutes_actual"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		completedAt: integer("completed_at", { mode: "timestamp" }),
	},
	(t) => [
		index("idx_break_created_at").on(t.createdAt),
		index("idx_break_user_id").on(t.userId),
		check("break_tipo_check", sql`${t.tipo} IN ('short', 'long')`),
		check(
			"break_status_check",
			sql`${t.status} IN ('active', 'completed', 'skipped', 'interrupted')`,
		),
	],
);
