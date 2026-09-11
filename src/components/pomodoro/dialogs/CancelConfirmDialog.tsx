/** @jsxImportSource react */

// Paraglide
import * as m from "../../../paraglide/messages";
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
						{m.timer_cancel_confirm_title()}
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed text-muted-foreground">
						{m.timer_cancel_confirm_body()}
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
						{m.timer_cancel_confirm_no()}
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						className="px-6"
						onClick={onCancel}
					>
						{m.timer_cancel_confirm_yes()}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
