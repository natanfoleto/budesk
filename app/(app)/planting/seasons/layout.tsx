import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Safras - Plantio",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
