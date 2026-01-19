"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Briefcase,
    DollarSign,
    Truck,
    FileText,
    ShieldCheck,
    Menu,
    LogOut,
    UserCircle,
    BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Briefcase, label: "Serviços", href: "/dashboard/services" },
    { icon: DollarSign, label: "Financeiro", href: "/dashboard/finance" },
    { icon: Users, label: "Clientes", href: "/dashboard/clients" },
    { icon: Users, label: "Fornecedores", href: "/dashboard/suppliers" },
    { icon: Users, label: "Funcionários", href: "/dashboard/employees" },
    { icon: Truck, label: "Frota", href: "/dashboard/fleet" },
    { icon: FileText, label: "Documentos", href: "/dashboard/documents" },
    { icon: BarChart, label: "Relatórios", href: "/dashboard/reports" },
    { icon: ShieldCheck, label: "Auditoria", href: "/dashboard/audit" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        // Clear cookie logic here or call API
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-white dark:bg-gray-800 md:flex">
                <div className="flex h-16 items-center justify-center border-b px-4">
                    <h1 className="text-xl font-bold text-primary">Budesk</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {sidebarItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                                        pathname === item.href
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "text-gray-700 dark:text-gray-200"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src="/avatars/01.png" alt="@user" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Admin</span>
                            <span className="text-xs text-gray-500">admin@budesk.com</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-gray-800 px-4 md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <div className="flex h-16 items-center justify-center border-b">
                                <h1 className="text-xl font-bold">Budesk</h1>
                            </div>
                            <nav className="flex-1 overflow-y-auto py-4">
                                <ul className="space-y-1 px-2">
                                    {sidebarItems.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                onClick={() => setOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                                                    pathname === item.href
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "text-gray-700 dark:text-gray-200"
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <span className="text-lg font-semibold">Budesk</span>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </header>

                {/* Top Navbar for Desktop (User Menu) */}
                <header className="hidden h-16 items-center justify-end border-b bg-white dark:bg-gray-800 px-6 md:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="rounded-full h-8 w-8 p-0">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
