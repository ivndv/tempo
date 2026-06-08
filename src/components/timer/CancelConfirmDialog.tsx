/** @jsxImportSource react */
// i18n
import { useTranslations } from "../../i18n/utils";
// Store
import { useStore } from "../../stores/store";

// Props del componente (interfaz local)
interface CancelConfirmDialogProps {
	onCancel: () => void;
	onBack: () => void;
}

// Diálogo de confirmación para cancelar la tarea
export default function CancelConfirmDialog({ onCancel, onBack }: CancelConfirmDialogProps) {
	const t = useTranslations(useStore((s) => s.lang));

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-sm">
			<div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up">
				{/* Ícono de advertencia */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-warning/15 text-warning">
					⚠
				</div>
				{/* Título y cuerpo */}
				<h3 className="text-xl font-black">
					{t("timer.cancel.confirm.title")}
				</h3>
				<p className="text-sm leading-relaxed text-base-content/70">
					{t("timer.cancel.confirm.body")}
				</p>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center pt-2">
					<button
						type="button"
						onClick={onBack}
						className="btn btn-outline btn-sm px-6"
					>
						{t("timer.cancel.confirm.no")}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="btn btn-error btn-sm px-6"
					>
						{t("timer.cancel.confirm.yes")}
					</button>
				</div>
			</div>
		</div>
	);
}
