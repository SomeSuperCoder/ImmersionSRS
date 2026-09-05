import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TopBar } from '@/components/top-bar'

export const Route = createRootRoute({
  component: () => (
    <>
      <TopBar />
      <Outlet />
    </>
  ),
})
