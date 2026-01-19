"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Truck, Settings } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { VehicleType } from "@/lib/types";

const vehicleSchema = z.object({
    plate: z.string().min(7, "Placa deve ter 7 caracteres."),
    model: z.string().min(2),
    brand: z.string().min(2),
    year: z.coerce.number().int(),
    type: z.nativeEnum(VehicleType),
});

export default function FleetPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof vehicleSchema>>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            plate: "",
            model: "",
            brand: "",
            year: new Date().getFullYear(),
            type: VehicleType.CARRO,
        },
    });

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vehicles`);
            const data = await res.json();
            if (data.success) {
                setVehicles(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const onSubmit = async (values: z.infer<typeof vehicleSchema>) => {
        try {
            const res = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Veículo cadastrado!");
                setIsOpen(false);
                form.reset();
                fetchVehicles();
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
                <h2 className="text-3xl font-bold tracking-tight">Frota</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Novo Veículo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Novo Veículo</DialogTitle>
                            <DialogDescription>
                                Adicione um veículo à frota da empresa.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="plate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Placa</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ABC1D23" {...field} className="uppercase" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="year"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ano</FormLabel>
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
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Marca</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Toyota" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Modelo</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Hilux" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CARRO">Carro</SelectItem>
                                                    <SelectItem value="MOTO">Moto</SelectItem>
                                                    <SelectItem value="CAMINHAO">Caminhão</SelectItem>
                                                    <SelectItem value="OUTRO">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                {vehicles.map((vehicle: any) => (
                    <Card key={vehicle.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Truck className="h-4 w-4 text-blue-700" />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-sm font-medium leading-none">
                                        {vehicle.brand} {vehicle.model}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {vehicle.plate}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Ano: {vehicle.year}</span>
                                <span className="uppercase border px-1 rounded text-[10px]">{vehicle.type}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {!loading && vehicles.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum veículo cadastrado.
                </div>
            )}
        </div>
    );
}
