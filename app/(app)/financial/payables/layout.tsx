import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contas a Pagar - Financeiro",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

