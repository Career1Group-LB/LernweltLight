import { useQuery } from '@tanstack/react-query';

import { configApi } from '@/shared/api/config.api';
import type { FeatureFlag } from '@/shared/types/common';

export function useFeatureFlag(flag: FeatureFlag): boolean {
    const { data } = useQuery({
        queryKey: ['config'],
        queryFn: configApi.getConfig,
        staleTime: Infinity,
    });
    return data?.featureFlags?.[flag] ?? false;
}
