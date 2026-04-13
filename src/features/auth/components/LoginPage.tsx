import { useLogin } from "../hooks/useLogin";

export default function LoginPage() {
	const { mutate: login, isPending, isError } = useLogin();

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
				backgroundColor: "#f8f9fa",
			}}
		>
			<div
				style={{
					backgroundColor: "#fff",
					padding: "40px",
					borderRadius: "12px",
					boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
					textAlign: "center",
				}}
			>
				<h1 style={{ marginBottom: "8px" }}>Lernwelt</h1>
				<p style={{ color: "#666", marginBottom: "32px" }}>
					Deine Lernplattform
				</p>
				<button
					onClick={() => login({ email: "demo@lernwelt.de", password: "demo" })}
					disabled={isPending}
					style={{
						backgroundColor: "#063844",
						color: "#fff",
						border: "none",
						padding: "12px 32px",
						borderRadius: "8px",
						fontSize: "16px",
						cursor: isPending ? "not-allowed" : "pointer",
						opacity: isPending ? 0.7 : 1,
					}}
				>
					{isPending ? "Anmelden..." : "Demo-Login"}
				</button>
				{isError && (
					<p style={{ marginTop: "12px", fontSize: "14px", color: "#c0392b" }}>
						Login fehlgeschlagen. Bitte erneut versuchen.
					</p>
				)}
				<p style={{ marginTop: "16px", fontSize: "12px", color: "#999" }}>
					Echter OAuth-Login folgt wenn Auth-Service steht
				</p>
			</div>
		</div>
	);
}
