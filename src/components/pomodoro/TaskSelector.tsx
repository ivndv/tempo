/** @jsxImportSource react */
// Iconos
import { Icon } from "@iconify/react";
// React
import { useState } from "react";
// Store
import { useShallow } from "zustand/react/shallow";
// i18n
import { useTranslations } from "../../i18n/utils";
// Utilidades
import { getTodaysStats, getWeeklyStats } from "../../lib/stats";
import { useStore } from "../../stores/store";
// Componentes
import DailySummary from "../stats/DailySummary";
import WeeklySummary from "../stats/WeeklySummary";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";

// Props del componente (interfaz local)
interface TaskSelectorProps {
	onSelectTask: (tareaId: number) => void;
	onCreateTask: (nombre: string, categoriaId?: number) => void;
}

// Devuelve clases Tailwind para el badge según el nombre de categoría
const getCategoryBadgeStyle = (nombre: string) => {
	const normalized = nombre.toLowerCase().trim();
	if (normalized === "trabajo" || normalized === "work") {
		return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20";
	}
	if (normalized === "estudio" || normalized === "study") {
		return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
	}
	if (normalized === "personal") {
		return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20";
	}
	const colors = [
		"bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",
		"bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20",
		"bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20",
		"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
	];
	const index = nombre.charCodeAt(0) % colors.length;
	return colors[index];
};

// Renderiza el selector de tareas con formulario, listado y estadísticas
export default function TaskSelector({
	onSelectTask,
	onCreateTask,
}: TaskSelectorProps) {
	const {
		tareas,
		categorias,
		updateTarea,
		deleteTarea,
		history,
		tareasPendientes,
	} = useStore(
		useShallow((s) => ({
			tareas: s.tareas,
			categorias: s.categorias,
			updateTarea: s.updateTarea,
			deleteTarea: s.deleteTarea,
			history: s.history,
			tareasPendientes: s.tareasPendientes,
		})),
	);
	const t = useTranslations(useStore((s) => s.lang));
	const [nombre, setNombre] = useState("");
	const [categoriaId, setCategoriaId] = useState<number | undefined>();

	// Filtra tareas pendientes o en progreso
	const pendientes = tareas.filter(
		(t) => t.estado === "pending" || t.estado === "in_progress",
	);

	// Crea una tarea nueva si el nombre no está vacío
	const handleCreate = () => {
		if (!nombre.trim()) return;
		onCreateTask(nombre.trim(), categoriaId);
		setNombre("");
		setCategoriaId(undefined);
	};

	// Calcula estadísticas de la sesión actual
	const todaysStats = getTodaysStats(history);
	const weeklyStats = getWeeklyStats(history);

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-10 py-6">
			{/* Tarjeta de Creación de Tareas */}
			<div className="bg-card/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-border/60 shadow-xl space-y-6 transition-all duration-300">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						{t("task.selector.title")}
					</h2>
					<p className="text-xs text-muted-foreground">
						{t("task.selector.subtitle")}
					</p>
				</div>

				{/* Input y botón de crear */}
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative flex-1">
						<span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
							<Icon icon="lucide:clipboard-list" className="w-5 h-5" />
						</span>
						<Input
							type="text"
							value={nombre}
							onChange={(e) => setNombre(e.target.value)}
							placeholder={t("task.selector.placeholder")}
							className="h-12 rounded-xl pl-12 pr-4 text-base"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
							}}
						/>
					</div>
					<Button
						type="button"
						onClick={handleCreate}
						disabled={!nombre.trim()}
						className="h-12 rounded-xl px-6 font-bold gap-2 transition-transform duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50"
					>
						<Icon icon="lucide:plus" className="w-5 h-5" />
						<span>{t("task.selector.create")}</span>
					</Button>
				</div>

				{/* Selector de categorías */}
				{categorias.length > 0 && (
					<div className="space-y-2.5 pt-2">
						<span className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
							<Icon icon="lucide:tag" className="w-3.5 h-3.5" />
							{t("task.selector.category")}
						</span>
						<div className="flex gap-2 flex-wrap">
							{categorias.map((cat) => {
								const isSelected = categoriaId === cat.id;
								return (
									<Button
										type="button"
										key={cat.id}
										onClick={() =>
											setCategoriaId(isSelected ? undefined : cat.id)
										}
										variant={isSelected ? "default" : "outline"}
										className="h-auto rounded-full px-4 py-1.5 font-medium transition-colors duration-200"
									>
										{isSelected && (
											<Icon icon="lucide:check" className="w-3 h-3 mr-1" />
										)}
										{cat.nombre}
									</Button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Listado de Tareas Pendientes */}
			{pendientes.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between px-1">
						<h3 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
							<Icon icon="lucide:list-todo" className="w-5 h-5 text-primary" />
							{t("task.selector.pending")}
						</h3>
						{/* Badge de cantidad */}
						<Badge
							variant="default"
							className="rounded-full px-2.5 py-1 font-bold"
						>
							{pendientes.length}
						</Badge>
					</div>

					<div className="space-y-3">
						{pendientes.map((tarea) => (
							<div
								key={tarea.id}
								className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-card/50 backdrop-blur-xs border border-border shadow-sm transition-colors duration-200 hover:bg-card/80 gap-4"
							>
								<div className="flex-1 min-w-0">
									<h4 className="font-semibold text-foreground/90 truncate transition-colors group-hover:text-primary">
										{tarea.nombre}
									</h4>
									{tarea.categoriaId && (
										<span
											className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5 ${getCategoryBadgeStyle(categorias.find((c) => c.id === tarea.categoriaId)?.nombre || "")}`}
										>
											<Icon icon="lucide:tag" className="w-3 h-3" />
											{categorias.find((c) => c.id === tarea.categoriaId)
												?.nombre || ""}
										</span>
									)}
									{tareasPendientes[tarea.id] !== undefined && (
										<span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md mt-1 ml-1.5">
											<Icon icon="lucide:clock" className="w-3 h-3" />
											{t("task.remaining", {
												minutes: Math.ceil(tareasPendientes[tarea.id] / 60),
											})}
										</span>
									)}
								</div>

								{/* Botones de acción rápida */}
								<div className="flex items-center gap-2 border-t border-border/50 pt-3 sm:border-0 sm:pt-0 justify-end">
									{/* Iniciar Pomodoro */}
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														type="button"
														onClick={() => onSelectTask(tarea.id)}
														size="icon-sm"
														className="hover:scale-110 transition-transform"
														aria-label={t("task.tooltip.start")}
													>
														<Icon
															icon="lucide:play"
															className="w-4 h-4 fill-current ml-0.5"
														/>
													</Button>
												}
											/>
											<TooltipContent>{t("task.tooltip.start")}</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														type="button"
														onClick={() =>
															updateTarea(tarea.id, { estado: "done" })
														}
														variant="outline"
														size="icon-sm"
														className="text-success hover:scale-110 hover:text-white hover:bg-success transition-transform"
														aria-label={t("task.tooltip.complete")}
													>
														<Icon icon="lucide:check" className="w-4 h-4" />
													</Button>
												}
											/>
											<TooltipContent>
												{t("task.tooltip.complete")}
											</TooltipContent>
										</Tooltip>

										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														type="button"
														onClick={() => deleteTarea(tarea.id)}
														variant="outline"
														size="icon-sm"
														className="text-destructive hover:scale-110 hover:text-white hover:bg-destructive transition-transform"
														aria-label={t("task.tooltip.delete")}
													>
														<Icon icon="lucide:trash-2" className="w-4 h-4" />
													</Button>
												}
											/>
											<TooltipContent>
												{t("task.tooltip.delete")}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Estadísticas del día */}
			{todaysStats.history.length > 0 && (
				<div className="space-y-6 pt-4">
					{/* Separador */}
					<div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-30">
						<span className="h-px flex-1 bg-foreground/20"></span>
						{t("stats.progress.title")}
						<span className="h-px flex-1 bg-foreground/20"></span>
					</div>

					<DailySummary
						history={todaysStats.history}
						hours={todaysStats.hours}
						minutes={todaysStats.minutes}
						count={todaysStats.sessionCount}
					/>

					<WeeklySummary weeklyStats={weeklyStats} />
				</div>
			)}
		</div>
	);
}
