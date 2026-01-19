"use client";

import { useEffect, useState } from "react";
import { Plus, Search, User, BadgeCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const employeeSchema = z.object({
    name: z.string().min(3),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    document: z.string().optional(),
    role: z.string().min(2),
    salary: z.coerce.number().optional(),
});

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            document: "",
            role: "Operador",
            salary: 1500, // Now number
        },
    });

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employees`);
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const onSubmit = async (values: z.infer<typeof employeeSchema>) => {
        try {
            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Funcionário cadastrado!");
                setIsOpen(false);
                form.reset();
                fetchEmployees();
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
                <h2 className="text-3xl font-bold tracking-tight">Funcionários</h2>
                <div className="flex gap-2">
                    <Button variant="outline">Adiantamentos</Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Novo Funcionário</DialogTitle>
                                <DialogDescription>
                                    Cadastre membros da equipe.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="João da Silva" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cargo/Função</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Motorista" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="salary"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Salário Base (R$)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
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
                                                        <Input placeholder="joao@budesk.com" {...field} />
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
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee: any) => (
                    <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-slate-700" />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-medium leading-none">
                                        {employee.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {employee.role}
                                    </CardDescription>
                                </div>
                            </div>
                            {employee.active ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>
                            ) : (
                                <Badge variant="secondary">Inativo</Badge>
                            )}
                        </CardHeader>
                        <CardContent className="mt-4 space-y-2">
                            <div className="text-xs text-muted-foreground flex justify-between border-b pb-2">
                                <span>Salário:</span>
                                <span className="font-medium">R$ {Number(employee.salary || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-2">
                                <span className="text-muted-foreground">{employee.email || "Sem email"}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {!loading && employees.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum funcionário encontrado.
                </div>
            )}
        </div>
    );
}
