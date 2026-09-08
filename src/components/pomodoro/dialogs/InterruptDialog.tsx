/** @jsxImportSource react */

// i18n
import { useTranslations } from "../../../i18n/utils";
// Store
import { useStore } from "../../../stores/store";
import { Button } from "../../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "../../ui/dialog";

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
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onContinue();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="max-w-sm p-8 text-center gap-6"
			>
				{/* Ícono de pausa */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-info/15 text-info">
					⏸
				</div>
				<div className="space-y-2">
					<DialogTitle className="text-xl font-black">
						{t("task.interrupt.title")}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{t("task.interrupt.title")}
					</DialogDescription>
				</div>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="px-6"
						onClick={onAbandon}
					>
						{t("task.interrupt.abandon")}
					</Button>
					<Button
						type="button"
						size="sm"
						className="px-6"
						onClick={onContinue}
						autoFocus
					>
						{t("task.interrupt.continue")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
