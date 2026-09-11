/** @jsxImportSource react */
// Iconos
import { Icon } from "@iconify/react";
// React
import { useEffect, useRef, useState } from "react";
// Store
import { useShallow } from "zustand/react/shallow";
// Utilidades
import { getTodaysStats, getWeeklyStats } from "../../lib/stats";
import { cargarMapaIds } from "../../lib/sync/sync";
// Paraglide
import * as m from "../../paraglide/messages";
import { useStore } from "../../stores/store";
import DailySummary from "../stats/DailySummary";
import WeeklySummary from "../stats/WeeklySummary";
import { Button } from "../ui/button";
// Componentes
import CancelConfirmDialog from "./dialogs/CancelConfirmDialog";
import CompleteDialog from "./dialogs/CompleteDialog";
import InterruptDialog from "./dialogs/InterruptDialog";

// Props del componente (interfaz local)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type TimerViewProps = Record<string, never>;

// Constantes del temporizador
const ALARM_SOUND = "https://assets.mgdc.site/tempo/alarm.mp3";
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Renderiza el temporizador pomodoro con control de sesión
export default function TimerView(_props: TimerViewProps) {
	const {
		tareas,
		updateTarea,
		pomodoroActivo,
		tareaActiva,
		completar,
		deleteTarea,
		interrumpir,
		reset,
		history,
		iniciarBreak,
	} = useStore(
		useShallow((s) => ({
			tareas: s.tareas,
			updateTarea: s.updateTarea,
			pomodoroActivo: s.pomodoroActivo,
			tareaActiva: s.tareaActiva,
			completar: s.completar,
			deleteTarea: s.deleteTarea,
			interrumpir: s.interrumpir,
			reset: s.reset,
			history: s.history,
			iniciarBreak: s.iniciarBreak,
		})),
	);
	// Constantes del temporizador y recuperación de sesión desde localStorage
	const POMODORO_SECONDS = (pomodoroActivo?.minutesPlanned || 25) * 60;
	const savedSecs = (() => {
		try {
			const saved = localStorage.getItem("pomodoro_active_session");
			if (saved) {
				const { startedAt } = JSON.parse(saved);
				return Math.floor((Date.now() - startedAt) / 1000);
			}
		} catch {}
		return null;
	})();
	const initialTimeLeft =
		savedSecs !== null
			? Math.max(POMODORO_SECONDS - savedSecs, 0)
			: POMODORO_SECONDS;
	const initialStartTime = (() => {
		try {
			const saved = localStorage.getItem("pomodoro_active_session");
			if (saved) {
				const { startedAt } = JSON.parse(saved);
				return startedAt;
			}
		} catch {}
		return Date.now();
	})();

	// Estados del temporizador y diálogos
	const haySesionGuardada = savedSecs !== null && savedSecs > 0;
	const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
	const [isActive, setIsActive] = useState(!haySesionGuardada);
	const [showComplete, setShowComplete] = useState(false);
	const [showInterrupt, setShowInterrupt] = useState(haySesionGuardada);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const startTimeRef = useRef(initialStartTime);

	const tarea =
		tareaActiva ||
		tareas.find((t) => t.id === pomodoroActivo?.tareaId) ||
		(() => {
			if (!pomodoroActivo) return undefined;
			const mapa = cargarMapaIds();
			const idReal = mapa[pomodoroActivo.tareaId];
			return idReal !== undefined
				? tareas.find((t) => t.id === idReal)
				: undefined;
		})();

	// Effect del temporizador: wall-clock para evitar congelamiento en background
	useEffect(() => {
		if (!isActive) return;

		const tick = () => {
			const elapsed = (Date.now() - startTimeRef.current) / 1000;
			const remaining = Math.max(POMODORO_SECONDS - elapsed, 0);
			const display = Math.ceil(remaining);
			setTimeLeft(display);

			if (display <= 0) {
				setIsActive(false);
				setShowComplete(true);
				playAlarm();
				return;
			}

			timeoutRef.current = setTimeout(tick, 1000);
		};

		const playAlarm = () => {
			try {
				new Audio(ALARM_SOUND).play();
			} catch {}
			if ("Notification" in window && Notification.permission === "granted") {
				new Notification("Tempo", { body: "¡Pomodoro completado!" });
			}
			const originalTitle = document.title;
			document.title = "⏰ Pomodoro completado!";
			setTimeout(() => {
				document.title = originalTitle;
			}, 5000);
		};

		timeoutRef.current = setTimeout(tick, 1000);
		return () => clearTimeout(timeoutRef.current);
	}, [isActive, POMODORO_SECONDS]);

	// Pausa el temporizador y muestra diálogo de interrupción
	const handlePause = () => {
		setIsActive(false);
		setShowInterrupt(true);
	};

	// Reanuda el temporizador desde donde se pausó
	const handleContinue = () => {
		setShowInterrupt(false);
		setIsActive(true);
		// Recalcula startTime para que el tiempo restante coincida con el que se pausó
		startTimeRef.current = Date.now() - (POMODORO_SECONDS - timeLeft) * 1000;
	};

	// Abandona la sesión actual y registra el tiempo trabajado
	const handleAbandon = async () => {
		const elapsed = Math.round((POMODORO_SECONDS - timeLeft) / 60);
		await interrumpir(Math.min(elapsed, Math.ceil(POMODORO_SECONDS / 60)));
		setShowInterrupt(false);
		reset();
	};

	// Marca el pomodoro como completado y la tarea como hecha
	const handleComplete = async () => {
		await completar();
		if (tarea) {
			await updateTarea(tarea.id, { estado: "done" });
		}
		setShowComplete(false);
		iniciarBreak();
	};

	// Completa el pomodoro pero la tarea sigue pendiente
	const handleNotYet = async () => {
		await completar();
		setShowComplete(false);
		iniciarBreak();
	};

	// Cancela la tarea: registra interrupción y elimina la tarea
	const handleCancelConfirm = async () => {
		const elapsed = Math.round((POMODORO_SECONDS - timeLeft) / 60);
		await interrumpir(Math.min(elapsed, Math.ceil(POMODORO_SECONDS / 60)));
		if (tarea) {
			await deleteTarea(tarea.id);
		}
		setShowCancelConfirm(false);
		reset();
	};

	// Muestra el diálogo de confirmación para cancelar la tarea
	const handleCancel = () => {
		setShowCancelConfirm(true);
	};

	// Solicita permiso de notificaciones al montar
	useEffect(() => {
		if ("Notification" in window && Notification.permission === "default") {
			Notification.requestPermission();
		}
	}, []);

	// Resetea el temporizador cuando no hay pomodoro activo
	useEffect(() => {
		if (!pomodoroActivo) {
			setTimeLeft(POMODORO_SECONDS);
		}
	}, [pomodoroActivo, POMODORO_SECONDS]);

	// Calcula estadísticas del día y la semana
	const todaysStats = getTodaysStats(history);
	const weeklyStats = getWeeklyStats(history);

	const progress = timeLeft / POMODORO_SECONDS;
	const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
			{/* Nombre de la tarea activa */}
			{tarea && (
				<div className="text-center space-y-2">
					<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
						<Icon icon="lucide:flame" className="w-3.5 h-3.5 animate-pulse" />
						{m.timer_active_focus()}
					</span>
					<h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
						{tarea.nombre}
					</h2>
				</div>
			)}

			{/* Círculo de progreso */}
			<div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
				<svg
					className="w-full h-full -rotate-90"
					viewBox="0 0 280 280"
					role="img"
					aria-label="Pomodoro Timer"
				>
					<title>Pomodoro Timer</title>
					{/* Círculo de fondo */}
					<circle
						cx="140"
						cy="140"
						r={RADIUS}
						stroke="currentColor"
						strokeWidth="14"
						fill="none"
						className="text-muted dark:text-foreground/10"
					/>
					{/* Círculo de progreso */}
					<circle
						cx="140"
						cy="140"
						r={RADIUS}
						stroke="currentColor"
						strokeWidth="14"
						fill="none"
						strokeLinecap="round"
						className="stroke-primary transition-all duration-1000 ease-linear"
						style={{
							strokeDasharray: CIRCUMFERENCE,
							strokeDashoffset: dashOffset,
						}}
					/>
					{/* Esquinas decorativas */}
					<circle
						cx="140"
						cy="20"
						r="3.5"
						className="fill-muted-foreground/20"
					/>
					<circle
						cx="260"
						cy="140"
						r="3.5"
						className="fill-muted-foreground/20"
					/>
					<circle
						cx="140"
						cy="260"
						r="3.5"
						className="fill-muted-foreground/20"
					/>
					<circle
						cx="20"
						cy="140"
						r="3.5"
						className="fill-muted-foreground/20"
					/>
				</svg>

				{/* Tiempo restante */}
				<div className="absolute flex flex-col items-center">
					<span className="text-6xl font-mono font-bold tracking-tighter text-primary select-none">
						{String(minutes).padStart(2, "0")}:
						{String(seconds).padStart(2, "0")}
					</span>
					<span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 mt-1 select-none">
						{isActive ? m.timer_focusing() : m.timer_paused()}
					</span>
				</div>
			</div>

			{/* Botones de control */}
			<div className="flex gap-4 items-center justify-center w-full max-w-sm">
				<Button
					type="button"
					onClick={handlePause}
					variant={isActive ? "outline" : "default"}
					className={`h-12 flex-1 rounded-xl font-bold gap-2 ${
						isActive ? "bg-card/50" : "shadow-sm hover:scale-[1.01]"
					}`}
					aria-label={isActive ? m.timer_run_pause() : m.timer_run_resume()}
				>
					<Icon
						icon={isActive ? "lucide:pause" : "lucide:play"}
						className="w-5 h-5"
					/>
					<span>{isActive ? m.timer_run_pause() : m.timer_run_resume()}</span>
				</Button>

				<Button
					type="button"
					onClick={handleCancel}
					variant="destructive"
					className="h-12 rounded-xl px-6 font-bold gap-2 hover:scale-[1.01] transition-transform"
					aria-label={m.timer_run_cancel()}
				>
					<Icon icon="lucide:x" className="w-5 h-5" />
					<span className="hidden sm:inline">{m.timer_run_cancel()}</span>
				</Button>
			</div>

			{todaysStats.history.length > 0 && (
				<div className="space-y-8 pt-6 w-full">
					<div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-30">
						<span className="h-px flex-1 bg-foreground/20"></span>
						{m.stats_progress_title()}
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

			{/* Diálogo de completado */}
			{showComplete && (
				<CompleteDialog
					tareaNombre={tarea?.nombre || ""}
					onComplete={handleComplete}
					onNotYet={handleNotYet}
				/>
			)}

			{/* Diálogo de interrupción */}
			{showInterrupt && (
				<InterruptDialog
					onContinue={handleContinue}
					onAbandon={handleAbandon}
				/>
			)}

			{/* Diálogo de confirmación de cancelación */}
			{showCancelConfirm && (
				<CancelConfirmDialog
					onCancel={handleCancelConfirm}
					onBack={() => setShowCancelConfirm(false)}
				/>
			)}
		</div>
	);
}
