import {createBrowserRouter, Outlet} from "react-router";
import Home from "@/pages/home/Home.tsx";
import Inflation from "@/pages/inflation/Inflation.tsx";
import AppWrapper from "@/components/wrapper/AppWrapper.tsx";

function RootLayout() {
	return (
		<AppWrapper>
			<Outlet/>
		</AppWrapper>
	);
}

export const router = createBrowserRouter([
	{
		path: "/",
		element: RootLayout(),
		children: [
			{index: true, Component: Home},
			{path: 'inflacja', Component: Inflation}
			// { path: "about", Component: About },
			// {
			// 	path: "auth",
			// 	Component: AuthLayout,
			// 	children: [
			// 		{ path: "login", Component: Login },
			// 		{ path: "register", Component: Register },
			// 	],
			// },
			// {
			// 	path: "concerts",
			// 	children: [
			// 		{ index: true, Component: ConcertsHome },
			// 		{ path: ":city", Component: ConcertsCity },
			// 		{ path: "trending", Component: ConcertsTrending },
			// 	],
			// },
		],
	},
]);
