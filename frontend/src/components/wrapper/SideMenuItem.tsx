import {NavLink} from 'react-router';

import type {SideMenuItemType} from './sideMenuItems';

/**
 * SideMenuItem component that renders a single navigation link.
 * It can optionally display an icon alongside the label.
 * The active state is handled by NavLink.
 * The label smoothly fades and slides in/out when the menu is collapsed/expanded.
 * Text color changes on hover based on the active state.
 */
interface SideMenuItemProps extends SideMenuItemType {
	collapsed?: boolean;
}

export function SideMenuItem({
															 path,
															 label,
															 icon,
															 testId,
															 collapsed = false,
														 }: SideMenuItemProps) {
	return (
		<li>
			<NavLink
				to={path}
				data-testid={testId}
				title={collapsed ? label : undefined}
				className={() =>
					`side-menu-item flex items-center p-4 bg-stone-50 px-5`
				}
			>
				{icon && (
					<span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {icon}
          </span>
				)}
				<span
					className={`ml-4 overflow-hidden transition-all duration-300 ${
						collapsed ? 'w-0 opacity-0 ml-0' : 'w-full opacity-100'
					}`}
				>
          {label}
        </span>
			</NavLink>
		</li>
	);
}

export default SideMenuItem;
