/**
 * Standard API error shape returned by the backend.
 */
export interface ApiError {
	message: string;
	statusCode: number;
	details?: Record<string, unknown>;
}

/**
 * Feature flag identifiers.
 * Must match the flags returned by the config service.
 */
export type FeatureFlag =
	| "liveStream"
	| "mediaLibrary"
	| "jobOffers"
	| "recruitment"
	| "certificates"
	| "participationCertificates"
	| "presencesAndAbsences"
	| "faq"
	| "interactiveExercises"
	| "yourProfile"
	| "dataSecurity"
	| "campus"
	| "learningCompanionChat";
