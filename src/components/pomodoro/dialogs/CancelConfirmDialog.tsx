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
interface CancelConfirmDialogProps {
	onCancel: () => void;
	onBack: () => void;
}

// Diálogo de confirmación para cancelar la tarea
export default function CancelConfirmDialog({
	onCancel,
	onBack,
}: CancelConfirmDialogProps) {
	const t = useTranslations(useStore((s) => s.lang));

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onBack();
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="max-w-sm p-8 text-center gap-6"
			>
				{/* Ícono de advertencia */}
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-warning/15 text-warning">
					⚠
				</div>
				<div className="space-y-2">
					{/* Título y cuerpo */}
					<DialogTitle className="text-xl font-black">
						{t("timer.cancel.confirm.title")}
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed text-muted-foreground">
						{t("timer.cancel.confirm.body")}
					</DialogDescription>
				</div>
				{/* Botones de acción */}
				<div className="flex gap-4 justify-center">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="px-6"
						onClick={onBack}
					>
						{t("timer.cancel.confirm.no")}
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						className="px-6"
						onClick={onCancel}
					>
						{t("timer.cancel.confirm.yes")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
