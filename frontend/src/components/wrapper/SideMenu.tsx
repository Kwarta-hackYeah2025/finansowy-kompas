import {sideMenuItems} from './sideMenuItems';
import {SideMenuItem} from './SideMenuItem';
import logo from '../../assets/raw.svg';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import {Divider} from "@mui/material";
import {Fragment} from "react";
import {colors} from "@/lib/colors.ts";

interface SideMenuProps {
	collapsed: boolean;
	toggleCollapse: () => void;
}

export function SideMenu({collapsed, toggleCollapse}: SideMenuProps) {

	return (
		<div
			id="side-menu"
			data-testid="side-menu"
			className={`side-zus-bg flex-shrink-0 z-22 h-full min-h-screen border-r border-tertiary transition-all duration-300 overflow-x-hidden ${
				collapsed ? 'w-[65px]' : 'w-64'
			}`}
		>
			<div
				style={{
				background: `linear-gradient(0deg, ${colors.green}, #01983f, ${colors.green})`,
			}}
				className={`flex items-center mb-6 h-16 py-4 pb-5 ${
					collapsed ? 'justify-center' : 'justify-between'
				}`}
			>
				{!collapsed && (
					<a href="/" className="flex items-center w-full">
						<img
							src={logo}
							alt="Logo"
							className="max-h-16"
						/>
						<span className="font-semibold text-white duration-700 hover:from-sky-300 hover:via-emerald-300 hover:to-lime-300">Finansowy{'\n'} Kompas</span>
					</a>
				)}

				<button
					onClick={toggleCollapse}
					className="p-1 cursor-pointer text-white focus:outline-none"
					aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
				>
					{collapsed ? <MenuIcon/> : <ChevronLeftIcon/>}
				</button>
			</div>

			{/* Navigation */}
			<nav className='mt-24 relative'>
				<ul>
					<Divider />
					{sideMenuItems.map((item) => {
						return (<Fragment key={item.path}>
							<SideMenuItem
								key={item.path}
								path={item.path}
								label={item.label}
								icon={item.icon}
								testId={item.testId}
								collapsed={collapsed}
							/>
								<Divider />
							</Fragment>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}

export default SideMenu;
