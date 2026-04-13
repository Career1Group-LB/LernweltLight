import "i18next";

// Importiere deine Übersetzungsdateien als Typen
import type auth from "../../public/locales/de/auth.json";
import type common from "../../public/locales/de/common.json";
import type courses from "../../public/locales/de/courses.json";
import type errors from "../../public/locales/de/errors.json";
import type profile from "../../public/locales/de/profile.json";
import type quiz from "../../public/locales/de/quiz.json";
// ... weitere Namespaces hier ergänzen wenn neue hinzukommen

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "common";
		resources: {
			common: typeof common;
			auth: typeof auth;
			courses: typeof courses;
			quiz: typeof quiz;
			profile: typeof profile;
			errors: typeof errors;
		};
	}
}
