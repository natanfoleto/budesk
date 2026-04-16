import { headers } from "next/headers"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { SidebarProvider } from "@/components/providers/sidebar-provider"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userRole = headersList.get("x-user-role") as string | undefined

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-1 flex-col min-w-0">
          <TopNav />
          <main className="flex-1 overflow-y-auto bg-muted/10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
