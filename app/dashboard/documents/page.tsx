"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, Download, Link as LinkIcon } from "lucide-react";
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

const documentSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    url: z.string().url("URL inválida").optional().or(z.literal('')),
    type: z.string().optional(),
});

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            title: "",
            description: "",
            url: "",
            type: "Geral",
        },
    });

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/documents`);
            const data = await res.json();
            if (data.success) {
                setDocuments(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const onSubmit = async (values: z.infer<typeof documentSchema>) => {
        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Documento registrado!");
                setIsOpen(false);
                form.reset();
                fetchDocuments();
            } else {
                toast.error(data.error || "Erro ao registrar.");
            }
        } catch (error) {
            toast.error("Erro interno.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Documentos</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Documento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Novo Documento</DialogTitle>
                            <DialogDescription>
                                Registre documentos importantes (apenas links por enquanto).
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
                                                <Input placeholder="Contrato Social" {...field} />
                                            </FormControl>
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
                                                <Input placeholder="Detalhes adicionais..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Link / URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://drive.google.com/..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Contrato, Nota Fiscal" {...field} />
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc: any) => (
                    <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-orange-700" />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-medium leading-none">
                                        {doc.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {doc.type}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 space-y-2">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {doc.description || "Sem descrição."}
                            </p>
                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center text-xs text-primary hover:underline mt-2">
                                    <LinkIcon className="mr-1 h-3 w-3" />
                                    Acessar Documento
                                </a>
                            )}
                            <div className="pt-2 text-[10px] text-muted-foreground border-t mt-2">
                                Criado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {!loading && documents.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum documento encontrado.
                </div>
            )}
        </div>
    );
}
