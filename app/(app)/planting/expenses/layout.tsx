import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gastos - Plantio",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

