import { z } from 'zod';

import type { FeatureFlag } from '@/shared/types/common';

const FeatureFlagSchema = z.enum([
    'liveStream',
    'mediaLibrary',
    'jobOffers',
    'recruitment',
    'certificates',
    'participationCertificates',
    'presencesAndAbsences',
    'faq',
    'interactiveExercises',
    'yourProfile',
    'dataSecurity',
    'campus',
    'learningCompanionChat',
] as [FeatureFlag, ...FeatureFlag[]]);

export const AppConfigSchema = z.object({
    featureFlags: z.record(FeatureFlagSchema, z.boolean()),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
