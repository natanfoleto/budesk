"use client";

import { useEffect, useState } from "react";
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function FinancePage() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resTrans, resAcc] = await Promise.all([
                    fetch("/api/financial-transactions"),
                    fetch("/api/accounts-payable?status=PENDENTE")
                ]);

                const dataTrans = await resTrans.json();
                const dataAcc = await resAcc.json();

                if (dataTrans.success) setTransactions(dataTrans.data);
                if (dataAcc.success) setAccounts(dataAcc.data);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Simple totals (for demo, ideally computed on backend or using all data)
    const totalInput = transactions.filter((t: any) => t.type === 'ENTRADA').reduce((acc, t: any) => acc + Number(t.amount), 0);
    const totalOutput = transactions.filter((t: any) => t.type === 'SAIDA').reduce((acc, t: any) => acc + Number(t.amount), 0);
    const balance = totalInput - totalOutput;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
                <div className="flex gap-2">
                    <Button variant="outline">Nova Conta a Pagar</Button>
                    <Button>Nova Transação</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {balance.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {totalInput.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">R$ {totalOutput.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                    <TabsTrigger value="transactions">Fluxo de Caixa</TabsTrigger>
                    <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transações Recentes</CardTitle>
                            <CardDescription>Histórico de entradas e saídas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t: any) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell>{t.category}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.type === 'ENTRADA' ? 'default' : 'destructive'}>
                                                    {t.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${t.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'ENTRADA' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!loading && transactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">Nhuma transação encontrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payables" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contas Pendentes</CardTitle>
                            <CardDescription>Faturas e boletos a vencer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Fornecedor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accounts.map((acc: any) => (
                                        <TableRow key={acc.id}>
                                            <TableCell>{new Date(acc.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{acc.description}</TableCell>
                                            <TableCell>{acc.supplier?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {acc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                R$ {Number(acc.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {/* Action buttons could go here */}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!loading && accounts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">Nenhuma conta pendente.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
