import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    // Use server components to fetch real data here later
    // For now, static placeholders
    const stats = [
        {
            title: "Receita Total",
            value: "R$ 45.231,89",
            description: "+20.1% em relação ao mês anterior",
            icon: DollarSign,
        },
        {
            title: "Serviços Ativos",
            value: "12",
            description: "3 finalizando esta semana",
            icon: Briefcase,
        },
        {
            title: "Novos Clientes",
            value: "+5",
            description: "Últimos 30 dias",
            icon: Users,
        },
        {
            title: "Lucro Líquido",
            value: "R$ 12.000,00",
            description: "Margem de 26%",
            icon: TrendingUp,
        },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                            Gráfico de Receita (Placeholder)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Serviços Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* List of recent services */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Manutenção do Trator</p>
                                    <p className="text-sm text-muted-foreground">Cliente: Fazenda Sol</p>
                                </div>
                                <div className="ml-auto font-medium">+R$ 1.999,00</div>
                            </div>
                            {/* ... more items */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
