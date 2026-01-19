"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Service, ServiceStatus } from "@/lib/types";

const serviceSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceStatus),
    startDate: z.string(), // HTML Date Input returns string
});

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof serviceSchema>>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            title: "",
            description: "",
            status: ServiceStatus.ABERTO,
            startDate: new Date().toISOString().split("T")[0],
        },
    });

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            if (data.success) {
                setServices(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
        try {
            const res = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Serviço criado com sucesso!");
                setIsOpen(false);
                form.reset();
                fetchServices();
            } else {
                toast.error(data.error || "Erro ao criar serviço.");
            }
        } catch (error) {
            toast.error("Erro interno.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Serviço</DialogTitle>
                            <DialogDescription>
                                Preencha os dados abaixo para registrar um novo serviço.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Reforma do Galpão" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de Início</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={ServiceStatus.ABERTO}>Aberto</SelectItem>
                                                    <SelectItem value={ServiceStatus.EM_ANDAMENTO}>Em Andamento</SelectItem>
                                                    <SelectItem value={ServiceStatus.FINALIZADO}>Finalizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Detalhes opcionais..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="submit">Salvar</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters (Visual Only for now) */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar serviços..."
                        className="pl-8"
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service: any) => (
                    <Link href={`/dashboard/services/${service.id}`} key={service.id}>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {service.title}
                                </CardTitle>
                                <Badge variant={
                                    service.status === 'FINALIZADO' ? 'secondary' :
                                        service.status === 'EM_ANDAMENTO' ? 'default' : 'outline'
                                }>
                                    {service.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mt-2">
                                    {/* Placeholder for cost/profit calculation */}
                                    R$ {service.transactions?.filter((t: any) => t.type === 'ENTRADA').reduce((a: number, b: any) => a + Number(b.amount), 0).toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                    {service.client?.name || "Cliente não informado"}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    Início: {new Date(service.startDate).toLocaleDateString('pt-BR')}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {!loading && services.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Nenhum serviço encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
