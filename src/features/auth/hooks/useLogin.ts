import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { authApi } from "../api/auth.api";
import { useAuth } from "./useAuth";

export function useLogin() {
	const { login } = useAuth();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: authApi.login,
		onSuccess: (data) => {
			login(data.accessToken);
			navigate("/courses");
		},
	});
}
