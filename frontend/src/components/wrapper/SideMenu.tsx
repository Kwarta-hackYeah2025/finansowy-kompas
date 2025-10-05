import {sideMenuItems} from './sideMenuItems';
import {SideMenuItem} from './SideMenuItem';
import logo from '../../assets/raw.svg';
import zusLogo from '../../assets/ZUS_logo.svg';
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
			className={`bg-[#00783412] flex-shrink-0 z-22 h-screen border-r border-tertiary transition-all duration-300 overflow-x-hidden relative pb-20 ${
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
			{/* Footer ZUS logo */}
			<div className="absolute bottom-3 left-0 right-0 flex justify-center">
				<a href="https://www.zus.pl" target="_blank" rel="noopener noreferrer" className="group">
					<div className={`relative ${collapsed ? 'w-12 h-12' : 'w-16 h-16'}`}>
						<div className="absolute bottom-4 inset-0 rounded-full bg-gradient-to-tr from-emerald-200 via-lime-300 to-emerald-300 opacity-20 blur-sm group-hover:opacity-70 transition-opacity"></div>
						<img src={zusLogo} alt="Logo ZUS" title="Zakład Ubezpieczeń Społecznych" className={`relative z-10 ${collapsed ? 'h-8' : 'h-10'} mx-auto drop-shadow-[0_0_1px_rgba(0,120,52,0.35)] transition-transform duration-500 group-hover:scale-105`} />
					</div>
				</a>
			</div>
		</div>
	);
}

export default SideMenu;
