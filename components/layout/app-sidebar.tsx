"use client"

import { 
  ChartColumnBig,
  ChevronRight,
  DollarSign, 
  FileText,
  LayoutDashboard, 
  LayoutList, 
  PanelLeftClose,
  PanelLeftOpen,
  Receipt, 
  Tractor,
  Truck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useSidebar } from "@/components/providers/sidebar-provider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: ChartColumnBig,
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
    title: "RH",
    icon: Users,
    children: [
      { title: "Visão Geral", href: "/rh" },
      { title: "Pagamentos", href: "/rh/payments" },
      { title: "Férias", href: "/rh/vacations" },
      { title: "13º Salário", href: "/rh/thirteenth" },
      { title: "Frequência", href: "/rh/attendance" },
      { title: "Relatórios", href: "/rh/reports" },
    ],
  },
  {
    title: "Plantio Manual",
    icon: Tractor,
    children: [
      { title: "Dashboard", href: "/planting/dashboard" },
      { title: "Apontamentos", href: "/planting/appointments" },
      { title: "Assistente de Pagamentos", href: "/planting/payments" },
      { title: "Gastos Operacionais", href: "/planting/expenses" },
      { title: "Safras e Frentes", href: "/planting/seasons" },
      { title: "Parâmetros Gerais", href: "/planting/parameters" },
      { title: "Fechamento", href: "/planting/closing" },
    ],
  },
  {
    title: "Frota",
    href: "/fleet",
    icon: Truck,
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
  const { isCollapsed, toggleSidebar } = useSidebar()
  
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
    finalMenu = []
  }

  return (
    <div 
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold overflow-hidden whitespace-nowrap">
              <LayoutDashboard className="h-6 w-6 shrink-0" />
              <span className="transition-opacity duration-300">Budesk</span>
            </Link>
            <button 
              onClick={toggleSidebar}
              className="cursor-pointer rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors"
              title="Recolher"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button 
            onClick={toggleSidebar}
            className="cursor-pointer rounded-md p-2 hover:bg-muted text-muted-foreground transition-colors"
            title="Expandir"
          >
            <PanelLeftOpen className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <ul className="space-y-2">
            {finalMenu.map((item) => (
              <li key={item.title}>
                {item.children ? (
                  <Collapsible 
                    defaultOpen={!isCollapsed && item.children.some(child => child.href === pathname)}
                    disabled={isCollapsed}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger 
                          aria-controls={`collapsible-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          className={cn(
                            "cursor-pointer flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&[data-state=open]>svg]:rotate-90 transition-all",
                            isCollapsed && "justify-center px-0"
                          )}
                        >
                          <div className={cn(
                            "flex items-center gap-2",
                            isCollapsed && "gap-0"
                          )}>
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span className="transition-opacity duration-300">{item.title}</span>}
                          </div>
                          {!isCollapsed && <ChevronRight className="h-4 w-4 transition-transform duration-200" />}
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title} (Clique para expandir o menu)
                        </TooltipContent>
                      )}
                    </Tooltip>
                    
                    {!isCollapsed && (
                      <CollapsibleContent id={`collapsible-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
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
                    )}
                  </Collapsible>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href!}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          isCollapsed && "justify-center px-0 gap-0"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="transition-opacity duration-300">{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </li>
            ))}

            {/* ROOT User Section */}
            {role === "ROOT" && (
              <>
                <div className={cn("my-4 border-t", isCollapsed && "mx-2")} />
                {!isCollapsed && (
                  <li className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap overflow-hidden">
                    Gerenciamento
                  </li>
                )}
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/users"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          pathname === "/users"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          isCollapsed && "justify-center px-0 gap-0"
                        )}
                      >
                        <Users className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>Usuários</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Usuários</TooltipContent>}
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/rh/jobs"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          pathname === "/rh/jobs"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          isCollapsed && "justify-center px-0 gap-0"
                        )}
                      >
                        <LayoutList className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>Cargos</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Cargos</TooltipContent>}
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/audit"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          pathname === "/audit"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          isCollapsed && "justify-center px-0 gap-0"
                        )}
                      >
                        <FileText className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>Auditoria</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Auditoria</TooltipContent>}
                  </Tooltip>
                </li>
                <li>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/settings"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          pathname === "/settings"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          isCollapsed && "justify-center px-0 gap-0"
                        )}
                      >
                        <Users className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>Configurações</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Configurações</TooltipContent>}
                  </Tooltip>
                </li>
              </>
            )}
          </ul>
        </nav>
      </TooltipProvider>
    </div>
  )
}
