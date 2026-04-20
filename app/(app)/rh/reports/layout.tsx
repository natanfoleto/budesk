import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Relatórios - RH",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
