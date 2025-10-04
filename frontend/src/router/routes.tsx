import {createBrowserRouter} from "react-router";
import Home from "@/pages/home/Home.tsx";
import Inflation from "@/pages/inflation/Inflation.tsx";
import RootLayout from "@/router/RootLayout.tsx";
import Retiring from "@/pages/retiring/Retiring.tsx";
import Analysis from "@/pages/retiring/Analysis.tsx";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{index: true, Component: Home},
			{path: 'inflacja', Component: Inflation},
			{path: 'emerytura', Component: Retiring},
			{path: 'emerytura/analiza', Component: Analysis},
		],
	},
]);
