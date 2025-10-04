import AppWrapper from "@/components/wrapper/AppWrapper"
import { Outlet } from "react-router"

function RootLayout() {
  return (
    <AppWrapper>
      <Outlet />
    </AppWrapper>
  )
}

export default RootLayout

