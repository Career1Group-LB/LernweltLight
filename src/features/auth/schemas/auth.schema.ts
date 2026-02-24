import { z } from 'zod';

export const LoginResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
