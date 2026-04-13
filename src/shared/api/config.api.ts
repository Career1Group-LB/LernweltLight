import type { AppConfig } from "@/shared/schemas/config.schema";
import { AppConfigSchema } from "@/shared/schemas/config.schema";

import { apiClient } from "./client";

export const configApi = {
	getConfig: async (): Promise<AppConfig> => {
		const response = await apiClient.get("/api/v1/config");
		return AppConfigSchema.parse(response.data);
	},
};
