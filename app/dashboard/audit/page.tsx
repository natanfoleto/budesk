"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AuditAction } from "@/lib/types";

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entityFilter, setEntityFilter] = useState("ALL");

    const fetchLogs = async (entity = "") => {
        setLoading(true);
        try {
            const url = entity && entity !== "ALL" ? `/api/audit?entity=${entity}` : `/api/audit`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleFilterChange = (value: string) => {
        setEntityFilter(value);
        fetchLogs(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Auditoria</h2>
                <div className="flex items-center gap-2">
                    <Select onValueChange={handleFilterChange} defaultValue="ALL">
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filtrar por Entidade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas as Entidades</SelectItem>
                            <SelectItem value="Service">Serviços</SelectItem>
                            <SelectItem value="FinancialTransaction">Transações</SelectItem>
                            <SelectItem value="Client">Clientes</SelectItem>
                            <SelectItem value="User">Usuários</SelectItem>
                            <SelectItem value="LoginLog">Logins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Logs de Sistema</CardTitle>
                    <CardDescription>Registro de todas as ações realizadas no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Entidade</TableHead>
                                <TableHead>Detalhes (ID)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{log.user?.name || "Sistema"}</span>
                                            <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            log.action === 'DELETE' ? 'destructive' :
                                                log.action === 'UPDATE' ? 'secondary' : 'default'
                                        }>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{log.entity}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {log.entityId}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6">Nenhum registro encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
