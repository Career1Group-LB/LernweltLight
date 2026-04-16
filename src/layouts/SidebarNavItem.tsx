// src/layouts/SidebarNavItem.tsx
import { NavLink } from "react-router-dom";

import { Icon } from "@/shared/components/Icon";

interface SidebarNavItemProps {
	label: string;
	to: string;
	iconName: string; // Material Symbols Name, z.B. 'home', 'calendar_today'
}

export function SidebarNavItem({ label, to, iconName }: SidebarNavItemProps) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				[
					"flex items-center gap-2",
					"px-3 py-2 rounded-full",
					"w-full no-underline",
					"font-text text-base leading-6",
					isActive
						? "bg-primary-container text-on-primary-container font-medium"
						: "text-on-surface-variant",
				].join(" ")
			}
		>
			{({ isActive }) => (
				<>
					{/* Icon: filled wenn aktiv, outline wenn inaktiv – direkt aus Figma-Spec */}
					<Icon name={iconName} filled={isActive} size={20} />

					{/* Label */}
					<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
						{label}
					</span>
				</>
			)}
		</NavLink>
	);
}
