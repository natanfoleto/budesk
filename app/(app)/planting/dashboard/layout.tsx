import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Plantio",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

