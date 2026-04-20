import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Frota",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
