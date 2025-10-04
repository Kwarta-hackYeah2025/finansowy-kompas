import SideMenu from "@/components/wrapper/SideMenu.tsx";
import {type ReactNode, useState} from "react";
import {useMediaQuery} from "@mui/material";

const AppWrapper = ({children}: { children: ReactNode }) => {
	const isBelowThreshold = useMediaQuery('(max-width: 999px)');

	const [menuCollapsed, setMenuCollapsed] = useState(isBelowThreshold);

	const toggleMenuCollapse = () => {
		setMenuCollapsed(!menuCollapsed);
	};

	return <div className="flex flex-col min-h-screen bg-red">
		{/*<AppBar/>*/}
		<div className="flex flex-1">
			<SideMenu
				collapsed={menuCollapsed}
				toggleCollapse={toggleMenuCollapse}
			/>
			<main className="flex-1 min-w-0 p-2 transition-all duration-300 min-h-[80vh] flex flex-col justify-between">
				{children}
				{/*<Footer menuCollapsed={menuCollapsed}/>*/}
			</main>
		</div>
	</div>
}

export default AppWrapper;