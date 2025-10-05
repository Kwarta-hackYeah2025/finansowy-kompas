import ElderlyOutlinedIcon from '@mui/icons-material/ElderlyOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import { type ReactNode } from 'react';

/**
 * Array of menu items for the side navigation.
 * Each item contains the necessary information to render a navigation link.
 */
export interface SideMenuItemType {
	path: string;
	label: string;
	icon?: ReactNode;
	testId?: string;
	user?: boolean;
}

export const sideMenuItems: SideMenuItemType[] = [
	{
		path: '/informacje',
		label: 'Kalkulator emerytury',
		icon: <InfoOutlinedIcon />,
	},
	{
		path: '/wartosc-pieniadza',
		label: 'Wartość pieniądza',
		icon: <SavingsOutlinedIcon />,
	},
	{
		path: '/emerytura',
		label: 'Symulacja',
		icon: <ElderlyOutlinedIcon />,
	},
];

export default sideMenuItems;
