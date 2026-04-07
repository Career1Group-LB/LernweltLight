// src/layouts/Sidebar.tsx
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/shared/components/Logo';
import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';
import type { FeatureFlag } from '@/shared/types/common';

import { SidebarNavItem } from './SidebarNavItem';


// ─── DATENMODELL ─────────────────────────────────────────────────────────────

// In Sidebar.tsx: Interface aktualisieren
interface NavItem {
    id: string;
    labelKey: ParseKeys<'common'>;
    to: string;
    iconName: string;   // ← war: icon: string
    featureFlag?: FeatureFlag;
}

// NAV_ITEMS: Emoji durch Material Symbol Namen ersetzen
const NAV_ITEMS: NavItem[] = [
    { id: 'nav-dashboard', labelKey: 'navigation.dashboard', to: '/courses', iconName: 'home' },
    { id: 'nav-courses', labelKey: 'navigation.learningPlan', to: '/courses', iconName: 'calendar_today' },
    { id: 'nav-notes', labelKey: 'navigation.notes', to: '/courses', iconName: 'note_alt' },
    { id: 'nav-media', labelKey: 'navigation.mediaLibrary', to: '/media-library', iconName: 'video_library', featureFlag: 'mediaLibrary' },
    { id: 'nav-jobs', labelKey: 'navigation.jobOffers', to: '/job-offers', iconName: 'work', featureFlag: 'jobOffers' },
];

// ─── HILFSKOMPONENTE: Nav-Item das hinter einem Feature Flag liegt ────────────

// Diese Komponente bekommt `flag` als non-optional FeatureFlag Prop.
// Dadurch kann useFeatureFlag IMMER und UNBEDINGT aufgerufen werden –
// das ist entscheidend für die Rules of Hooks (siehe Erklärung unten).
interface FeatureFlaggedNavItemProps {
    item: NavItem;
    flag: FeatureFlag;  // non-optional: hier ist immer ein konkreter Wert
    label: string;      // bereits übersetzt (kommt von t() in der Haupt-Komponente)
}

function FeatureFlaggedNavItem({ item, flag, label }: FeatureFlaggedNavItemProps) {
    const isEnabled = useFeatureFlag(flag); // ← immer aufgerufen, nie bedingt

    if (!isEnabled) return null;

    return <SidebarNavItem label={label} to={item.to} iconName={item.iconName} />;
}

// ─── HAUPT-KOMPONENTE ─────────────────────────────────────────────────────────

export function Sidebar() {
    // common ist der Default-Namespace → kein zweites Argument nötig
    // t('navigation.dashboard') → "Dashboard" (aus public/locales/de/common.json)
    const { t } = useTranslation();

    return (
        <aside className="w-[232px] shrink-0 py-2 pl-2 flex flex-col bg-surface-container">

            {/* Die Karte mit Schatten (aus Figma: Elevation Large) */}
            {/* bg-surface = var(--schemes-surface) → #fff Light, #0e1514 Dark */}
            <div
                className="flex-1 flex flex-col gap-4 p-4 rounded-3xl bg-surface overflow-hidden"
                style={{
                    // Komplexer Schatten aus Figma – noch kein Token dafür vorhanden
                    // Wird ersetzt wenn das Schatten-Token-System vom Designer kommt
                    boxShadow: '0px 0px 0px 1px rgba(0,0,0,0.08), 0px 8px 32px 0px rgba(0,0,0,0.12)',
                }}
            >
                {/* Logo-Bereich */}
                <div className="px-3 py-2">
                    <Logo width={100} />
                </div>

                {/* Navigations-Links */}
                <nav className="flex-1">
                    <ul className="list-none p-0 m-0 flex flex-col">
                        {NAV_ITEMS.map((item) => {
                            const label = t(item.labelKey); // Übersetzung einmal hier auflösen
                            return (
                                // key nutzt item.id – stabil, unabhängig von Übersetzungen
                                <li key={item.id}>
                                    {item.featureFlag ? (
                                        // Hat einen Feature Flag → FeatureFlaggedNavItem prüft ob aktiv
                                        <FeatureFlaggedNavItem item={item} flag={item.featureFlag} label={label} />
                                    ) : (
                                        // Kein Feature Flag → immer anzeigen
                                        <SidebarNavItem label={label} to={item.to} iconName={item.iconName} />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User-Bereich ganz unten */}
                {/* label kommt später aus dem Auth-Store (Profilname des eingeloggten Users) */}
                <div>
                    <SidebarNavItem label={t('navigation.profile')} to="/profile" iconName="account_circle" />
                </div>
            </div>
        </aside>
    );
}