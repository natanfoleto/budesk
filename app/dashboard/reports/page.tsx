"use client";

import { useEffect, useState } from "react";
import { BarChart, PieChart, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch("/api/reports");
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando relatórios...</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {data.financial.income.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">R$ {data.financial.expense.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.financial.net >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            R$ {data.financial.net.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Serviços por Status</CardTitle>
                        <CardDescription>Distribuição atual dos serviços.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.services.map((s: any) => (
                                <div key={s.status} className="flex items-center">
                                    <div className="w-[100px] text-sm font-medium">{s.status}</div>
                                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(s.count / data.services.reduce((a: any, b: any) => a + b.count, 0)) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-[50px] text-right text-sm text-muted-foreground">{s.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Clientes</CardTitle>
                        <CardDescription>Clientes com mais serviços contratados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topClients.map((c: any, i: number) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{c.name}</span>
                                    </div>
                                    <div className="font-bold text-sm">{c.serviceCount} serviços</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
