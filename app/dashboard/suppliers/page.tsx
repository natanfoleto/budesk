"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Truck, Phone, Mail } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const supplierSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    document: z.string().optional(),
    category: z.string().optional(),
});

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            document: "",
            category: "",
        },
    });

    const fetchSuppliers = async (search = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/suppliers?search=${search}`);
            const data = await res.json();
            if (data.success) {
                setSuppliers(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const onSubmit = async (values: z.infer<typeof supplierSchema>) => {
        try {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Fornecedor cadastrado!");
                setIsOpen(false);
                form.reset();
                fetchSuppliers();
            } else {
                toast.error(data.error || "Erro ao cadastrar.");
            }
        } catch (error) {
            toast.error("Erro interno.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Novo Fornecedor</DialogTitle>
                            <DialogDescription>
                                Cadastre fornecedores de insumos ou serviços.
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
                                                <Input placeholder="Fornecedor ABC" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Categoria</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Peças, Combustível" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="document"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CNPJ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="00.000.000/0000-00" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="vendas@fornecedor.com" {...field} />
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

                                <DialogFooter>
                                    <Button type="submit">Salvar</Button>
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
                        placeholder="Buscar fornecedores..."
                        className="pl-8"
                        onChange={(e) => {
                            if (e.target.value.length === 0 || e.target.value.length > 2) {
                                fetchSuppliers(e.target.value);
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((supplier: any) => (
                    <Card key={supplier.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <Truck className="h-4 w-4 text-secondary-foreground" />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-medium leading-none">
                                        {supplier.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {supplier.category || "Geral"}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 space-y-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Mail className="mr-2 h-3 w-3" />
                                {supplier.email || "Não informado"}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Phone className="mr-2 h-3 w-3" />
                                {supplier.phone || "Não informado"}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {!loading && suppliers.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum fornecedor encontrado.
                </div>
            )}
        </div>
    );
}
