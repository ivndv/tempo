/** @jsxImportSource react */
// Iconos
import { Icon } from "@iconify/react";
// React
import { useEffect, useRef, useState } from "react";
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type BreakTimerProps = Record<string, never>

// Constantes del temporizador
const ALARM_SOUND = "https://pomodoro-assets.mgdc.site/alarm.mp3";
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Renderiza el temporizador de descanso
export default function BreakTimer(_props: BreakTimerProps) {
	const t = useTranslations(useStore((s) => s.lang));
	const breakActivo = useStore((s) => s.breakActivo);
	const completarBreak = useStore((s) => s.completarBreak);
	const saltarBreak = useStore((s) => s.saltarBreak);
	const isLoggedIn = useStore((s) => s.isLoggedIn);

	const totalSeconds = (breakActivo?.minutesPlanned ?? 5) * 60;
	const [timeLeft, setTimeLeft] = useState(totalSeconds);
	const [isDone, setIsDone] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval>>();

	// Effect del temporizador de descanso: descuenta cada segundo
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					setIsDone(true);
					new Audio(ALARM_SOUND).play().catch(() => {});
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(intervalRef.current);
	}, []);

	// Salta el descanso y registra como saltado
	const handleSkip = async () => {
		clearInterval(intervalRef.current);
		await saltarBreak(isLoggedIn);
	};

	// Continúa después del descanso completado
	const handleContinue = async () => {
		await completarBreak(isLoggedIn);
	};

	const progress = timeLeft / totalSeconds;
	const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;

	// Muestra la vista de descanso completado
	if (isDone) {
		return (
			<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
				<div className="text-center space-y-4">
					{/* Ícono de éxito */}
					<div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mx-auto bg-success/15 text-success animate-bounce">
						✓
					</div>
					<h2 className="text-3xl font-black">{t("break.done_title")}</h2>
					<p className="text-base-content/60 text-sm">{t("break.done_desc")}</p>
					<button
						type="button"
						onClick={handleContinue}
						className="btn btn-primary btn-lg px-10 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
					>
						{t("break.continue")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
			{/* Etiqueta y título del descanso */}
			<div className="text-center space-y-2">
				<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-success bg-success/10 px-3 py-1 rounded-full">
					<Icon icon="lucide:coffee" className="w-3.5 h-3.5" />
					{breakActivo?.tipo === "long"
						? t("break.long_label")
						: t("break.short_label")}
				</span>
				<h2 className="text-2xl md:text-3xl font-black text-base-content/90 tracking-tight mt-1">
					{t("break.title")}
				</h2>
			</div>

			{/* Círculo de progreso del descanso */}
			<div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
				<svg
					className="w-full h-full -rotate-90"
					viewBox="0 0 280 280"
					role="img"
					aria-label="Break Timer"
				>
					<title>Break Timer</title>
					{/* Círculo de fondo */}
					<circle
						cx="140"
						cy="140"
						r={RADIUS}
						stroke="currentColor"
						strokeWidth="14"
						fill="none"
						className="text-base-300 dark:text-base-content/10"
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
						className="stroke-success transition-all duration-1000 ease-linear"
						style={{
							strokeDasharray: CIRCUMFERENCE,
							strokeDashoffset: dashOffset,
						}}
					/>
					{/* Esquinas decorativas */}
					<circle cx="140" cy="20" r="3.5" className="fill-base-content/20" />
					<circle cx="260" cy="140" r="3.5" className="fill-base-content/20" />
					<circle cx="140" cy="260" r="3.5" className="fill-base-content/20" />
					<circle cx="20" cy="140" r="3.5" className="fill-base-content/20" />
				</svg>

				{/* Tiempo restante */}
				<div className="absolute flex flex-col items-center">
					<span className="text-6xl font-mono font-bold tracking-tighter text-success select-none">
						{String(minutes).padStart(2, "0")}:
						{String(seconds).padStart(2, "0")}
					</span>
					<span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 mt-1 select-none">
						{t("break.resting")}
					</span>
				</div>
			</div>

			{/* Botón de saltar descanso */}
			<button
				type="button"
				onClick={handleSkip}
				className="btn btn-outline border-base-300 hover:bg-base-200 h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2"
			>
				<Icon icon="lucide:skip-forward" className="w-5 h-5" />
				<span>{t("break.skip")}</span>
			</button>
		</div>
	);
}
