import SideMenu from "@/components/wrapper/SideMenu.tsx";
import {type ReactNode, useState} from "react";
import {useMediaQuery} from "@mui/material";

const AppWrapper = ({children}: { children: ReactNode }) => {
	const isBelowThreshold = useMediaQuery('(max-width: 999px)');

	const [menuCollapsed, setMenuCollapsed] = useState(isBelowThreshold);

	const toggleMenuCollapse = () => {
		setMenuCollapsed(!menuCollapsed);
	};

	return <div className="flex h-screen overflow-hidden flex-col">
		{/*<AppBar/>*/}
		<div className="flex flex-1 h-full">
			<SideMenu
				collapsed={menuCollapsed}
				toggleCollapse={toggleMenuCollapse}
			/>
			<main className="flex-1 min-w-0 h-full overflow-hidden transition-all duration-300 flex flex-col main-zus-bg">
				<div className="flex-1 overflow-y-auto p-2">
					{children}
				</div>
				{/*<Footer menuCollapsed={menuCollapsed}/>*/}
			</main>
		</div>
	</div>
}

export default AppWrapper;