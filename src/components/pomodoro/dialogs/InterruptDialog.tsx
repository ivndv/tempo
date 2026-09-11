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
interface InterruptDialogProps {
	onContinue: () => void;
	onAbandon: () => void;
}

// Diálogo de interrupción del pomodoro
export default function InterruptDialog({
	onContinue,
	onAbandon,
}: InterruptDialogProps) {
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
						{m.task_interrupt_title()}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{m.task_interrupt_title()}
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
						{m.task_interrupt_abandon()}
					</Button>
					<Button
						type="button"
						size="sm"
						className="px-6"
						onClick={onContinue}
						autoFocus
					>
						{m.task_interrupt_continue()}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
