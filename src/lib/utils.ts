import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combina y resuelve conflictos de clases Tailwind
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
