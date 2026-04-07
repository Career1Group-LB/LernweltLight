import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

// eslint-disable-next-line import-x/no-named-as-default-member
i18next
    // Lädt Übersetzungsdateien lazy – nur wenn ein Namespace gebraucht wird
    // Flutter-Analogie: Lazy Loading von ARB-Dateien statt alles auf einmal
    .use(
        resourcesToBackend(
            (language: string, namespace: string) =>
                import(`../../public/locales/${language}/${namespace}.json`),
        ),
    )
    // Erkennt automatisch die Browser-Sprache des Users
    .use(LanguageDetector)
    // Bindet i18n an React
    .use(initReactI18next)
    .init({
        // Fallback-Sprache wenn die erkannte Sprache nicht verfügbar ist
        fallbackLng: 'de',

        // Standard-Namespace (wird geladen wenn kein Namespace angegeben)
        defaultNS: 'common',

        ns: ['common'],          // ← neu

        // Alle verfügbaren Sprachen
        supportedLngs: ['de', 'en'],

        // Interpolation: {{variable}} statt {variable} wie in Flutter
        interpolation: {
            // React schützt schon vor XSS – escaping hier deaktivieren
            escapeValue: false,
        },

        // Wichtig für Pluralisierung (unten mehr dazu)
        pluralSeparator: '_',

        // Während Entwicklung: Fehlende Keys als Warnung in der Konsole
        debug: import.meta.env.DEV,
    });

export default i18next;