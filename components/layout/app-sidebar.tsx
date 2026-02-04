"use client"

import { 
  DollarSign, 
  FileText,
  LayoutDashboard, 
  Receipt, 
  Truck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    children: [
      { title: "Visão Geral", href: "/financial" },
      { title: "Caixa", href: "/financial/transactions" },
      { title: "Contas a Pagar", href: "/financial/payables" },
    ],
  },
  {
    title: "Funcionários",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Serviços",
    href: "/services",
    icon: Receipt,
  },
  {
    title: "Clientes",
    href: "/clients",
    icon: Users, // Using same icon or maybe UserCog? Let's use Users for now as generic. Or Briefcase? Prompt didn't specify. I'll stick to Users or similar.
  },
  {
    title: "Fornecedores",
    href: "/suppliers",
    icon: Truck,
  },
  {
    title: "Documentos",
    href: "/documents",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/40">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span>Budesk</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            pathname === child.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
