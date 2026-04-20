import { Metadata } from "next"

export const metadata: Metadata = {
  title: "13º Salário - RH",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
