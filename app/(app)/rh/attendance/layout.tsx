import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Frequência - RH",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
