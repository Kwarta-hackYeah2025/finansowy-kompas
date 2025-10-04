import AppsIcon from '@mui/icons-material/Apps';
import ContactMailOutlinedIcon from '@mui/icons-material/ContactMailOutlined';
import LiveHelpOutlinedIcon from '@mui/icons-material/LiveHelpOutlined';
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined';
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
		label: 'Informacje',
		icon: <InfoOutlinedIcon />,
	},
	{
		path: '/wartosc-pieniadza',
		label: 'Wartość pieniądza',
		icon: <SavingsOutlinedIcon />,
	},
	{
		path: '/inflacja',
		label: 'Inflacja',
		icon: <AppsIcon />,
	},
	{
		path: '/emerytura',
		label: 'Emerytura',
		icon: <ElderlyOutlinedIcon />,
	},
	{
		path: '/ppk',
		label: 'PPK',
		icon: <ViewStreamOutlinedIcon />,
		user: true,
	},
	{
		path: '/gielda',
		label: 'Giełda',
		icon: <LiveHelpOutlinedIcon />,
	},
	{
		path: '/lokaty',
		label: 'Lokaty',
		icon: <ContactMailOutlinedIcon />,
	},
];

export default sideMenuItems;
