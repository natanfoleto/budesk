import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cargos - RH",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

