/** @jsxImportSource react */
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
interface InterruptDialogProps {
	onContinue: () => void;
	onAbandon: () => void;
}

// Diálogo de interrupción del pomodoro
export default function InterruptDialog({
	onContinue,
	onAbandon,
}: InterruptDialogProps) {
	const t = useTranslations(useStore((s) => s.lang));

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-sm">
			<div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up">
				{/* Ícono de pausa */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-info/15 text-info">
					⏸
				</div>
				<h3 className="text-xl font-black">{t("task.interrupt.title")}</h3>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center pt-2">
					<button
						type="button"
						onClick={onAbandon}
						className="btn btn-outline btn-sm px-6"
					>
						{t("task.interrupt.abandon")}
					</button>
					<button
						type="button"
						onClick={onContinue}
						className="btn btn-primary btn-sm px-6"
					>
						{t("task.interrupt.continue")}
					</button>
				</div>
			</div>
		</div>
	);
}
