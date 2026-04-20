import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Apontamentos - Plantio",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

