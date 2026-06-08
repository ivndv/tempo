/** @jsxImportSource react */
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
interface CompleteDialogProps {
	tareaNombre: string;
	onComplete: () => void;
	onNotYet: () => void;
}

// Diálogo de completado de pomodoro
export default function CompleteDialog({
	tareaNombre,
	onComplete,
	onNotYet,
}: CompleteDialogProps) {
	const t = useTranslations(useStore((s) => s.lang));

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-sm">
			<div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up">
				{/* Ícono de éxito */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-success/15 text-success">
					✓
				</div>
				{/* Título y nombre de la tarea */}
				<h3 className="text-xl font-black">{t("task.complete.prompt")}</h3>
				<p className="text-sm leading-relaxed text-base-content/70">
					“{tareaNombre}”
				</p>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center pt-2">
					<button
						type="button"
						onClick={onNotYet}
						className="btn btn-outline btn-sm px-6"
					>
						{t("task.complete.no")}
					</button>
					<button
						type="button"
						onClick={onComplete}
						className="btn btn-primary btn-sm px-6"
					>
						{t("task.complete.yes")}
					</button>
				</div>
			</div>
		</div>
	);
}
