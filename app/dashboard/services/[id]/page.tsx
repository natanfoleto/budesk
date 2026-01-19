"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash, DollarSign, FileText, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Service, ServiceStatus } from "@/lib/types";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ServiceDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await fetch(`/api/services/${id}`);
                const data = await res.json();
                if (data.success) {
                    setService(data.data);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchService();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

        try {
            const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Serviço excluído com sucesso.");
                router.push("/dashboard/services");
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Erro ao excluir serviço.");
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (!service) return <div>Serviço não encontrado.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{service.title}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant={service.status === 'FINALIZADO' ? 'secondary' : 'default'}>
                            {service.status}
                        </Badge>
                        <span className="text-sm">Iniciado em {new Date(service.startDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Financeiro</CardTitle>
                        <CardDescription>Resumo financeiro do serviço</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 0,00</div>
                        <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                        <CardDescription>Dados do cliente vinculado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{(service as any).client?.name || "Não informado"}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="fleet">Frota</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transações Financeiras</CardTitle>
                            <CardDescription>Entradas e Saídas vinculadas a este serviço.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center p-4 text-muted-foreground">
                                Nenhuma transação registrada.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="documents">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-center p-4 text-muted-foreground">
                                Nenhum documento anexado.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="fleet">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex justify-center p-4 text-muted-foreground">
                                Nenhum veículo utilizado.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
