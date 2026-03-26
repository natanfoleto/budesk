import { headers } from "next/headers"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopNav } from "@/components/layout/top-nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userRole = headersList.get("x-user-role") as string | undefined

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar userRole={userRole} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
