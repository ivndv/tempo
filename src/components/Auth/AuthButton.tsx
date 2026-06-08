/** @jsxImportSource react */
import { Icon } from "@iconify/react";
import { authClient } from "../../lib/auth-client";
import { useStore } from "../../stores/store";

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
			<div className="btn btn-ghost btn-sm">
				<span className="loading loading-spinner loading-xs"></span>
			</div>
		);
	}

	if (isLoggedIn && user) {
		return (
			<button
				type="button"
				onClick={handleLogout}
				className="btn btn-ghost btn-sm gap-2 px-3 group"
			>
				<Icon
					icon="lucide:log-out"
					className="w-4 h-4 group-hover:text-primary transition-colors"
				/>
				<span>{logoutText}</span>
			</button>
		);
	}

	return (
		<a href={loginUrl} className="btn btn-ghost btn-sm gap-2 px-3 group">
			<Icon
				icon="lucide:log-in"
				className="w-4 h-4 group-hover:text-primary transition-colors"
			/>
			<span>{loginText}</span>
		</a>
	);
}
