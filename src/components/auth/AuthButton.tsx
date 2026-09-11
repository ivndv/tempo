/** @jsxImportSource react */
import { Icon } from "@iconify/react";
import { authClient } from "../../lib/client/auth-client";
import { cn } from "../../lib/utils";
import { useStore } from "../../stores/store";
import { Button, buttonVariants } from "../ui/button";

interface Props {
	loginText: string;
	logoutText: string;
	loginUrl: string;
}

export default function AuthButton({ loginText, logoutText, loginUrl }: Props) {
	const isLoggedIn = useStore((s) => s.isLoggedIn);
	const user = useStore((s) => s.user);
	const sessionLoading = useStore((s) => s.sessionLoading);

	const handleLogout = async () => {
		await authClient.signOut();
		window.location.href = "/";
	};

	if (sessionLoading) {
		return (
			<Button variant="ghost" size="sm" disabled>
				<Icon icon="lucide:loader-circle" className="animate-spin" />
			</Button>
		);
	}

	if (isLoggedIn && user) {
		return (
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="gap-2 px-3 group"
				onClick={handleLogout}
			>
				<Icon
					icon="lucide:log-out"
					className="w-4 h-4 group-hover:text-primary transition-colors"
				/>
				<span>{logoutText}</span>
			</Button>
		);
	}

	return (
		<a
			href={loginUrl}
			data-astro-reload
			className={cn(
				buttonVariants({ variant: "ghost", size: "sm" }),
				"gap-2 px-3 group",
			)}
		>
			<Icon
				icon="lucide:log-in"
				className="w-4 h-4 group-hover:text-primary transition-colors"
			/>
			<span>{loginText}</span>
		</a>
	);
}
