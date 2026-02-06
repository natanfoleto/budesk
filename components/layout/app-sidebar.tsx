"use client"

import { 
  ChevronRight,
  Clock,
  DollarSign, 
  FileText,
  LayoutDashboard, 
  Receipt, 
  Truck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useUser } from "@/hooks/use-user"
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
    icon: Users, 
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

interface AppSidebarProps {
  userRole?: string 
}

export function AppSidebar({ userRole: initialRole }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: user } = useUser()
  
  // Use role from hook if available, otherwise fallback to prop or undefined
  const role = user?.role || initialRole

  // Filter menu items based on role
  const filteredMenuItems = menuItems.filter(_item => {
    if (role === "EMPLOYEE") {
      return false 
    }
    return true
  })

  // Start with default menu logic
  let finalMenu = filteredMenuItems

  if (role === "EMPLOYEE") {
    finalMenu = [
      {
        title: "Registrar Ponto",
        href: "/employees/time-tracking-view", 
        icon: Clock, 
      }
    ]
  }

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
          {finalMenu.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <Collapsible defaultOpen={item.children.some(child => child.href === pathname)}>
                  <CollapsibleTrigger className="cursor-pointer flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&[data-state=open]>svg]:rotate-90">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
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
                  </CollapsibleContent>
                </Collapsible>
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

          {/* ROOT User Section */}
          {role === "ROOT" && (
            <>
              <div className="my-4 border-t" />
              <li className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                Gerenciamento
              </li>
              <li>
                <Link
                  href="/users"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/users"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </Link>
              </li>
              <li>
                <Link
                  href="/audit"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/audit"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Auditoria
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/settings"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                   Configurações
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  )
}
