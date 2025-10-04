import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {RouterProvider} from "react-router/dom";
import {router} from "@/router/routes.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
    <QueryClientProvider client={queryClient}>
			<RouterProvider router={router}></RouterProvider>
        <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
	</StrictMode>,
)
