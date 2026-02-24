import { apiClient } from '@/shared/api/client';

import { LoginResponseSchema } from '../schemas/auth.schema';
import type { LoginRequest, LoginResponse } from '../schemas/auth.schema';

const BASE = '/api/v1/auth';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post(`${BASE}/login`, credentials);
        return LoginResponseSchema.parse(response.data);
    },

    logout: async (): Promise<void> => {
        await apiClient.post(`${BASE}/logout`);
    },
};
