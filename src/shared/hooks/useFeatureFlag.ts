import { useQuery } from '@tanstack/react-query';

import type { FeatureFlag } from '@/shared/types/common';

// Platzhalter-Funktion – später ersetzt durch echten API-Call:
// const response = await apiClient.get('/config');
async function fetchConfig() {
    return {
        featureFlags: {
            // Erstmal alles auf false – aktiviere Features wenn du sie baust
            liveStream: false,
            mediaLibrary: false,
            jobOffers: false,
            recruitment: false,
            certificates: true,
            participationCertificates: true,
            presencesAndAbsences: false,
            faq: true,
            interactiveExercises: false,
            yourProfile: true,
            dataSecurity: true,
            campus: false,
            learningCompanionChat: false,
        } as Record<FeatureFlag, boolean>,
    };
}

// Dieser Hook gibt zurück ob ein Feature aktiv ist
// Beispiel: useFeatureFlag('liveStream') → false
export function useFeatureFlag(flag: FeatureFlag): boolean {
    const { data } = useQuery({
        queryKey: ['config'],
        queryFn: fetchConfig,
        staleTime: Infinity, // Config einmal laden und nie wieder neu holen
    });
    // ?? false = wenn data noch nicht geladen → false zurückgeben (Feature aus)
    return data?.featureFlags?.[flag] ?? false;
}