/** @jsxImportSource react */
// React
import { useEffect, useState } from "react";
// Paraglide
import * as m from "../../paraglide/messages";
import { getLocale } from "../../paraglide/runtime";
// Tipos locales
import type { WeeklySummaryProps } from "./types";

// Muestra el gráfico de barras semanal con estadísticas
export default function WeeklySummary({ weeklyStats }: WeeklySummaryProps) {
	const locale = getLocale();
	// Estado para activar la animación después del montaje
	const [animate, setAnimate] = useState(false);

	// Activa la animación en el siguiente tick
	useEffect(() => {
		const timeout = setTimeout(() => setAnimate(true), 50);
		return () => clearTimeout(timeout);
	}, []);

	// Etiquetas de días según el idioma
	const daysEs = ["L", "M", "M", "J", "V", "S", "D"];
	const daysEn = ["M", "T", "W", "T", "F", "S", "S"];
	const daysLabels = locale === "es" ? daysEs : daysEn;

	// Calcula el total y el promedio semanal
	const totalMinutes = weeklyStats.reduce((acc, curr) => acc + curr.minutes, 0);
	const averageMinutes = Math.round(totalMinutes / (weeklyStats.length || 7));

	// Calcula el máximo para escalar las barras (mínimo 60 min)
	const rawMax = Math.max(...weeklyStats.map((d) => d.minutes));
	const maxMinutes = Math.ceil(Math.max(rawMax, 60) / 60) * 60;
	const maxHours = maxMinutes / 60;

	return (
		<div className="w-full bg-card/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-border/60 shadow-xl animate-fade-in-up relative overflow-hidden group/card">
			{/* Fondo decorativo sutil */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>

			<div className="flex justify-between items-center mb-6">
				{/* Título */}
				<h4 className="text-xs font-bold uppercase opacity-50 z-10">
					{m.stats_weekly_title()}
				</h4>
				{/* Total semanal */}
				<div className="text-[10px] font-mono opacity-50 bg-muted border border-border/20 px-2.5 py-1 rounded-md z-10">
					Total:{" "}
					<span className="font-bold text-primary">
						{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
					</span>
				</div>
			</div>

			<div className="relative h-44 mt-2">
				{/* 1. Grid Lines (Fondo de la gráfica) */}
				<div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
					{["top", "mid", "bot"].map((pos) => (
						<div
							key={`grid-${pos}`}
							className="w-full border-b border-dashed border-foreground/10 h-full last:border-0 relative"
						>
							{/* Etiqueta de hora en la grid */}
							<span className="absolute -top-2 left-0 text-[9px] font-mono opacity-20">
								{pos === "top"
									? `${maxHours}h`
									: pos === "mid"
										? `${maxHours / 2}h`
										: ""}
							</span>
						</div>
					))}
					{/* Línea base */}
					<div className="w-full border-b border-foreground/10"></div>
				</div>

				{/* 2. Línea de Promedio Diario */}
				{averageMinutes > 0 && averageMinutes <= maxMinutes && (
					<div
						className="absolute left-0 right-0 border-t border-dashed border-secondary/40 z-10 flex justify-end pointer-events-none transition-all duration-1000 ease-out"
						style={{
							bottom: `${(averageMinutes / maxMinutes) * 100}%`,
						}}
					>
						{/* Etiqueta del promedio */}
						<span className="bg-muted/90 text-secondary text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-secondary/20 -mt-2 shadow-xs select-none">
							{m.stats_weekly_average({ minutes: String(averageMinutes) })}
						</span>
					</div>
				)}

				{/* 3. Barras */}
				<div className="absolute inset-x-0 bottom-0 top-6 flex justify-between items-end px-2 pt-2">
					{weeklyStats.map((stat, index) => {
						const heightPercent = (stat.minutes / maxMinutes) * 100;
						// Determina si es el día actual
						const isToday = new Date().getDay() === (index + 1) % 7;

						return (
							<div
								key={stat.day}
								className="flex flex-col items-center flex-1 h-full justify-end group z-10 relative"
							>
								{/* Fondo hover vertical */}
								<div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl -z-10 mx-[-4px]"></div>

								{/* Tooltip flotante */}
								<div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 bottom-full mb-2.5 z-20 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
									<div className="bg-muted/95 backdrop-blur-md text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-xl border border-foreground/10 whitespace-nowrap flex flex-col items-center gap-0.5">
										{/* Minutos del día */}
										<span className="text-primary font-extrabold">
											{stat.minutes} min
										</span>
										{/* Cantidad de sesiones */}
										<span className="text-[8px] opacity-60 font-semibold">
											{stat.count}{" "}
											{stat.count === 1
												? m.stats_session_singular()
												: m.stats_session_plural()}
										</span>
									</div>
									{/* Flechita del tooltip */}
									<div className="w-1.5 h-1.5 bg-muted rotate-45 mx-auto -mt-1.5 border-r border-b border-foreground/10"></div>
								</div>

								{/* Barra con animación (scaleY) */}
								<div
									className={`w-full max-w-[12px] md:max-w-[20px] rounded-t-full transition-transform duration-1000 ease-out relative overflow-hidden group-hover:scale-x-110 group-hover:brightness-105 ${
										stat.minutes > 0
											? "bg-linear-to-t from-primary/70 to-primary shadow-[0_0_12px_rgba(249,115,22,0.15)]"
											: "bg-foreground/10"
									} ${isToday ? "ring-1 ring-primary/40 opacity-100" : "opacity-75 group-hover:opacity-100"}`}
									style={{
										height: "100%",
										transformOrigin: "bottom",
										transform: `scaleY(${animate ? Math.max(heightPercent / 100, 0.03) : 0.03})`,
										transitionDelay: `${index * 50}ms`,
									}}
								>
									{/* Brillo superior de la barra */}
									{stat.minutes > 0 && (
										<div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20"></div>
									)}
								</div>

								{/* Etiqueta del día */}
								<span
									className={`text-[9px] md:text-[10px] uppercase mt-3.5 font-bold transition-colors ${
										isToday
											? "text-primary"
											: "opacity-40 group-hover:opacity-80"
									}`}
								>
									{daysLabels[index]}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
