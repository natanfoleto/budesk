import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Funcionários",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
