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
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onNotYet();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="max-w-sm p-8 text-center gap-6"
			>
				{/* Ícono de éxito */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-success/15 text-success">
					✓
				</div>
				<div className="space-y-2">
					{/* Título y nombre de la tarea */}
					<DialogTitle className="text-xl font-black">
						{t("task.complete.prompt")}
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed text-muted-foreground">
						“{tareaNombre}”
					</DialogDescription>
				</div>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="px-6"
						onClick={onNotYet}
					>
						{t("task.complete.no")}
					</Button>
					<Button type="button" size="sm" className="px-6" onClick={onComplete}>
						{t("task.complete.yes")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
