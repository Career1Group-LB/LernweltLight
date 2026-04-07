// src/shared/components/Icon.tsx

interface IconProps {
    /** Material Symbols Icon-Name, z.B. 'home', 'calendar_today', 'note_alt' */
    name: string;
    /** Ausgefüllte Variante (FILL 1) – nutze für aktive/hervorgehobene Zustände */
    filled?: boolean;
    /** Größe in px – entspricht der font-size der Variable Font (Standard: 24) */
    size?: number;
    /** Zusätzliche Tailwind-Klassen für Farbe, Margin etc. */
    className?: string;
}

export function Icon({ name, filled = false, size = 24, className }: IconProps) {
    return (
        <span
            className={`material-symbols-rounded select-none leading-none ${className ?? ''}`}
            style={{
                fontSize: size,
                // Variable Font Axes – Material Symbols Spezifikation:
                // FILL: 0 = Outline, 1 = Filled
                // wght: Strichstärke (100–700), 400 = Regular
                // GRAD: Gewichtsanpassung ohne Layoutverschiebung (-50–200), 0 = neutral
                // opsz: Optical Size – stimmt die Detailschärfe auf die Größe ab (20–48)
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
            }}
            aria-hidden="true"
        >
            {name}
        </span>
    );
}