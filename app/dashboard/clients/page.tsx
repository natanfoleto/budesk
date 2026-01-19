"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Building2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const clientSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    document: z.string().optional(),
    address: z.string().optional(),
});

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            document: "",
            address: "",
        },
    });

    const fetchClients = async (search = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?search=${search}`);
            const data = await res.json();
            if (data.success) {
                setClients(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const onSubmit = async (values: z.infer<typeof clientSchema>) => {
        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Cliente cadastrado com sucesso!");
                setIsOpen(false);
                form.reset();
                fetchClients();
            } else {
                toast.error(data.error || "Erro ao cadastrar cliente.");
            }
        } catch (error) {
            toast.error("Erro interno.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Novo Cliente</DialogTitle>
                            <DialogDescription>
                                Cadastre um novo cliente para vincular a serviços.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome / Razão Social</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Empresa X" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="contato@empresa.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telefone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="(11) 99999-9999" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="document"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CPF/CNPJ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="000.000.000-00" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Endereço</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rua X, 123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="submit">Salvar Cliente</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar clientes por nome, email ou documento..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // Debounce could be added here
                            if (e.target.value.length === 0 || e.target.value.length > 2) {
                                fetchClients(e.target.value);
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client: any) => (
                    <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-medium leading-none">
                                        {client.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {client.document || "Sem documento"}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 space-y-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Mail className="mr-2 h-3 w-3" />
                                {client.email || "Não informado"}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Phone className="mr-2 h-3 w-3" />
                                {client.phone || "Não informado"}
                            </div>
                            <div className="pt-2 text-xs font-medium border-t mt-2">
                                Serviços Ativos: {client._count?.services || 0}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {!loading && clients.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum cliente encontrado.
                </div>
            )}
        </div>
    );
}
