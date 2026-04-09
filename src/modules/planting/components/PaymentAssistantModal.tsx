"use client"

import { PlantingPayment } from "@prisma/client"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Copy,
  Landmark,
  MoreHorizontal,
  QrCode,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { apiRequest } from "@/lib/api-client"
import { cn, formatAccountIdentifier, formatCentsToReal, parseLocalDate } from "@/lib/utils"

import { EmployeeSummary } from "../services/PlantingEmployeeService"

interface PaymentAssistantModalProps {
  employeeId: string | null
  seasonId: string
  baseMonthStr?: string // e.g., "2026-04"
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
  onNavigate?: (target: "details" | "assistant") => void
}

export function PaymentAssistantModal({
  employeeId,
  seasonId,
  baseMonthStr,
  open,
  onOpenChange,
  onUpdate,
  onNavigate
}: PaymentAssistantModalProps) {
  const [data, setData] = useState<EmployeeSummary | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [applyCompensationRules, setApplyCompensationRules] = useState(true)

  // Filter state
  type FilterType = "GERAL" | "HOJE" | "P_QUINZENAL" | "S_QUINZENAL" | "MES_ATUAL" | "CUSTOM" | string
  const [filterType, setFilterType] = useState<FilterType>("GERAL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [availableMonths, setAvailableMonths] = useState<{ year: number; month: number }[]>([])

  // Payment form state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [holeriteValue, setHoleriteValue] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState("")
  const [isPaidNow, setIsPaidNow] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // Pix QR Code state
  const [pixDialogOpen, setPixDialogOpen] = useState(false)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixAmount, setPixAmount] = useState<number>(0)
  const [pixPaymentId, setPixPaymentId] = useState<string>("")
  const [pixKey, setPixKey] = useState<string>("")
  const [pixEmployeeName, setPixEmployeeName] = useState<string>("")
  const [isLoadingPix, setIsLoadingPix] = useState(false)
  const [pixError, setPixError] = useState<string | null>(null)
  const [pixKeyType, setPixKeyType] = useState<string>("")

  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to QR code when generated
  useEffect(() => {
    if (pixQrCode && !isLoadingPix) {
      setTimeout(() => {
        qrCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }, [pixQrCode, isLoadingPix])

  const formatPixKey = (value: string, type?: string) => {
    const clean = value.replace(/\D/g, "")
    
    // If type is known, be more strict
    if (type === "PIX_CPF") {
      return clean.slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }

    if (type === "PIX_CNPJ") {
      return clean.slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$3")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }

    if (type === "PIX_TELEFONE") {
      return clean.slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
    }

    // Fallback/Auto-detection if type unspecified or different
    if (!type || type === "PIX_CHAVE_ALEATORIA" || type === "PIX_EMAIL") {
      if (value.includes("@")) return value
      if (clean.length === 11) return formatPixKey(clean, "PIX_CPF")
      if (clean.length === 14) return formatPixKey(clean, "PIX_CNPJ")
      if (clean.length === 10) return formatPixKey(clean, "PIX_TELEFONE")
    }

    return value 
  }

  const handleOpenPix = (paymentId: string, amountInCents: number) => {
    // Pre-fill pix key from employee's default or first PIX account
    const accounts = data?.employee?.accounts || []
    const defaultAccount = accounts.find(a => a.isDefault) || accounts.find(a => a.type !== "BANCARIA") || null
    const prefilledKey = defaultAccount?.identifier || ""

    setPixAmount(amountInCents / 100)
    setPixPaymentId(paymentId)
    setPixKeyType(defaultAccount?.type || "")
    setPixKey(formatPixKey(prefilledKey, defaultAccount?.type || ""))
    setPixEmployeeName(data?.employee?.name || "")
    setPixQrCode(null)
    setPixPayload(null)
    setPixError(null)
    setPixDialogOpen(true)
  }

  const handleGeneratePix = async () => {
    if (!pixKey.trim()) {
      setPixError("Informe a chave Pix para continuar.")
      return
    }
    setPixQrCode(null)
    setPixPayload(null)
    setPixError(null)
    setIsLoadingPix(true)
    try {
      const result = await apiRequest<{ payload: string; qrCode: string }>("/api/planting/pix", {
        method: "POST",
        body: JSON.stringify({
          amount: pixAmount,
          txid: `pagamento${pixPaymentId}`,
          key: pixKey.trim(),
          name: pixEmployeeName,
        }),
      })
      setPixQrCode(result.qrCode)
      setPixPayload(result.payload)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar QR Code Pix"
      setPixError(msg)
    } finally {
      setIsLoadingPix(false)
    }
  }

  const handleCopyPixCode = () => {
    if (!pixPayload) return
    navigator.clipboard.writeText(pixPayload)
    toast.success("Código Pix copiado!")
  }

  const fetchMonths = useCallback(async () => {
    if (!employeeId || !seasonId) return
    try {
      const result = await apiRequest<{ year: number; month: number }[]>(`/api/planting/employees/${employeeId}/months?seasonId=${seasonId}`)
      setAvailableMonths(result)
    } catch (error) {
      console.error("Erro ao buscar meses:", error)
    }
  }, [employeeId, seasonId])

  const calculateDateRange = useCallback((type: FilterType) => {
    const now = new Date()
    now.setHours(12, 0, 0, 0)
    
    switch (type) {
    case "HOJE":
      return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") }
    case "P_QUINZENAL": {
      const start = startOfMonth(now)
      const end = new Date(start)
      end.setDate(15)
      return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") }
    }
    case "S_QUINZENAL": {
      const start = startOfMonth(now)
      start.setDate(16)
      const end = endOfMonth(now)
      return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") }
    }
    case "MES_ATUAL":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") }
    default:
      if (type.startsWith("MONTH_")) {
        const parts = type.split("_")
        const [y, m] = parts[1].split("-").map(Number)
        const subType = parts[2]

        const monthDate = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
        if (subType === "FULL") {
          return { start: format(startOfMonth(monthDate), "yyyy-MM-dd"), end: format(endOfMonth(monthDate), "yyyy-MM-dd") }
        } else if (subType === "Q1") {
          const start = startOfMonth(monthDate)
          const end = new Date(start)
          end.setDate(15)
          return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") }
        } else if (subType === "Q2") {
          const start = startOfMonth(monthDate)
          start.setDate(16)
          const end = endOfMonth(monthDate)
          return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") }
        }
      }
      return { start: "", end: "" }
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ seasonId })
      
      if (filterType !== "GERAL") {
        const range = filterType === "CUSTOM" ? { start: startDate, end: endDate } : calculateDateRange(filterType)
        if (range.start) params.append("startDate", range.start)
        if (range.end) params.append("endDate", range.end)
      } else if (baseMonthStr) {
        const [year, month] = baseMonthStr.split("-").map(Number)
        const date = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
        params.append("startDate", format(startOfMonth(date), "yyyy-MM-dd"))
        params.append("endDate", format(endOfMonth(date), "yyyy-MM-dd"))
      }

      const result = await apiRequest<EmployeeSummary>(`/api/planting/employees/${employeeId}/summary?${params.toString()}`)
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [employeeId, seasonId, baseMonthStr, filterType, startDate, endDate, calculateDateRange])

  useEffect(() => {
    if (open && employeeId) {
      fetchData()
      fetchMonths()
    } else {
      setData(null)
      setAvailableMonths([])
    }
  }, [open, employeeId, fetchData, fetchMonths])

  useEffect(() => {
    if (filterType !== "CUSTOM" && filterType !== "GERAL") {
      const range = calculateDateRange(filterType)
      setStartDate(range.start)
      setEndDate(range.end)
    } else if (filterType === "GERAL") {
      setStartDate("")
      setEndDate("")
    }
  }, [filterType, calculateDateRange])

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`, {
      description: text,
    })
  }

  const handleEditPayment = (payment: PlantingPayment) => {
    setEditingPaymentId(payment.id)
    setPaymentDate(format(parseLocalDate(payment.date), "yyyy-MM-dd"))
    setHoleriteValue(payment.holeriteNetInCents)
    setPaymentNotes(payment.notes || "")
    setIsPaidNow(payment.isPaid)
  }

  const handleCancelEdit = () => {
    setEditingPaymentId(null)
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    setHoleriteValue(0)
    setPaymentNotes("")
    setIsPaidNow(false)
  }

  const handleRegisterPayment = async () => {
    if (!employeeId || !seasonId || !data) return
    if (!holeriteValue || holeriteValue <= 0) {
      toast.error("Informe um valor válido para o holerite")
      return
    }

    setIsSubmittingPayment(true)
    try {
      let parts = paymentDate.split("-").map(Number)
      if (baseMonthStr) {
        parts = baseMonthStr.split("-").map(Number)
      }

      if (editingPaymentId) {
        await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${editingPaymentId}`, {
          method: "PATCH",
          body: JSON.stringify({
            date: paymentDate,
            holeriteNetInCents: holeriteValue,
            isPaid: isPaidNow,
            notes: paymentNotes
          })
        })
        toast.success("Pagamento atualizado com sucesso!")
      } else {
        await apiRequest(`/api/planting/employees/${employeeId}/payments`, {
          method: "POST",
          body: JSON.stringify({
            date: paymentDate,
            seasonId,
            month: parts ? parts[1] : new Date().getMonth() + 1,
            year: parts ? parts[0] : new Date().getFullYear(),
            systemBrutoInCents: data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.paidLeavesValueInCents || 0) : 0),
            systemNetInCents: data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.netCompensationInCents || 0) : 0) - data.totals.advancesInCents,
            holeriteNetInCents: holeriteValue,
            isPaid: isPaidNow,
            notes: paymentNotes
          })
        })
        toast.success("Pagamento registrado com sucesso!")
      }

      setEditingPaymentId(null)
      setHoleriteValue(0)
      setPaymentNotes("")
      setIsPaidNow(false)
      fetchData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao registrar pagamento")
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleTogglePaymentPaid = async (paymentId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPaid: !currentStatus })
      })
      toast.success(currentStatus ? "Pagamento marcado como pendente" : "Pagamento marcado como pago")
      fetchData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao atualizar status do pagamento")
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${id}`, {
        method: "DELETE"
      })
      toast.success("Pagamento removido")
      fetchData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao remover pagamento")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] sm:max-w-none flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 border-b shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <DialogTitle className="text-2xl font-bold flex flex-col items-start gap-1">
                {loading && !data ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-primary leading-tight">{data?.employee.name}</span>
                    {onNavigate && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ClipboardList
                              className="size-5 text-muted-foreground hover:text-primary transition-colors cursor-pointer ml-1"
                              onClick={() => onNavigate("details")}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver Detalhes do Funcionário</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </DialogTitle>
              <DialogDescription>
                Assistente financeiro do holerite
              </DialogDescription>
            </div>
            
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px] justify-end">
                {data && (
                  <Label className="text-[10px] uppercase font-semibold px-0.5">
                    Safra: {data.seasonName}
                  </Label>
                )}
                <Select value={filterType} onValueChange={(val: FilterType) => setFilterType(val)}>
                  <SelectTrigger className="h-9 w-[180px] bg-background">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GERAL">Geral (Todo o histórico)</SelectItem>
                    <SelectItem value="HOJE">Hoje ({format(new Date(), "dd/MM")})</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1">
                      Mês Atual
                    </div>
                    <SelectItem value="MES_ATUAL">{format(startOfMonth(new Date()), "MMMM/yy", { locale: ptBR })} (Geral)</SelectItem>
                    <SelectItem value="P_QUINZENAL" className="pl-6 text-xs text-muted-foreground">1ª quinzena (01-15)</SelectItem>
                    <SelectItem value="S_QUINZENAL" className="pl-6 text-xs text-muted-foreground">2ª quinzena (16-{format(endOfMonth(new Date()), "dd")})</SelectItem>

                    {availableMonths.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1">
                          Meses Anteriores
                        </div>
                        {availableMonths
                          .filter(m => {
                            const now = new Date()
                            return !(m.year === now.getFullYear() && m.month === (now.getMonth() + 1))
                          })
                          .map(m => {
                            const monthDate = new Date(m.year, m.month - 1, 1)
                            const monthName = format(monthDate, "MMMM/yy", { locale: ptBR })
                            const lastDay = format(endOfMonth(monthDate), "dd")
                            return (
                              <div key={`${m.year}-${m.month}`} className="space-y-0.5">
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_FULL`}>
                                  {monthName} (Geral)
                                </SelectItem>
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_Q1`} className="pl-6 text-xs text-muted-foreground">
                                  1ª quinzena (01-15)
                                </SelectItem>
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_Q2`} className="pl-6 text-xs text-muted-foreground">
                                  2ª quinzena (16-{lastDay})
                                </SelectItem>
                              </div>
                            )
                          })
                        }
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {filterType === "CUSTOM" && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-[130px] bg-background text-xs"
                  />
                  <span className="text-muted-foreground text-[10px] font-medium uppercase">até</span>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-[130px] bg-background text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="h-full px-6">
            {loading && !data ? (
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : data ? (
              <div className="py-6 space-y-8 pb-12">
                {/* Seção de Totais do Sistema */}
                <div className="flex items-center justify-end mb-4">
                  <div className="flex items-center gap-2 bg-muted/40 p-2 px-3 rounded-lg border border-primary/20 shadow-sm">
                    <Label htmlFor="apply-compensation" className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none">
                      Aplicar compensação (Faltas/Chuvas)
                    </Label>
                    <Switch
                      id="apply-compensation"
                      checked={applyCompensationRules}
                      onCheckedChange={setApplyCompensationRules}
                      className="h-4 w-7 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardHeader className="p-4 pb-1">
                      <Label className="text-[10px] font-bold text-emerald-700 uppercase">Produção / Diárias</Label>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xl font-black text-emerald-900">
                        {formatCurrency(data.totals.earnedInCents)}
                      </div>
                      <p className="text-[9px] text-emerald-600 font-medium">Dias trabalhados</p>
                    </CardContent>
                  </Card>

                  <Card className={cn("border-blue-200 transition-all", applyCompensationRules ? "bg-blue-50/30" : "bg-muted/10 opacity-60")}>
                    <CardHeader className="p-4 pb-1">
                      <Label className="text-[10px] font-bold text-blue-700 uppercase">Folgas / Chuvas / Atestados (+)</Label>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className={cn("text-xl font-black transition-colors", applyCompensationRules ? "text-blue-900" : "text-muted-foreground line-through")}>
                        {formatCurrency(data.compensation?.paidLeavesValueInCents || 0)}
                      </div>
                      <p className="text-[9px] text-blue-600 font-medium">
                        {data.compensation?.paidLeavesCount || 0} dia(s) a pagar {(data.compensation?.paidLeavesCount || 0) > 0 && `(${formatCurrency((data.compensation?.paidLeavesValueInCents || 0) / (data.compensation?.paidLeavesCount || 1))}/dia)`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className={cn("border-orange-200 transition-all", applyCompensationRules ? "bg-orange-50/30" : "bg-muted/10 opacity-60")}>
                    <CardHeader className="p-4 pb-1">
                      <Label className="text-[10px] font-bold text-orange-700 uppercase">Faltas (-)</Label>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className={cn("text-xl font-black transition-colors", applyCompensationRules ? "text-destructive" : "text-muted-foreground line-through")}>
                        -{formatCurrency(data.compensation?.absencesValueInCents || 0)}
                      </div>
                      <p className="text-[9px] text-orange-600 font-medium">
                        {data.compensation?.absencesCount || 0} dia(s) descontado(s) {(data.compensation?.absencesCount || 0) > 0 && `(${formatCurrency((data.compensation?.absencesValueInCents || 0) / (data.compensation?.absencesCount || 1))}/dia)`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50/30">
                    <CardHeader className="p-4 pb-1">
                      <Label className="text-[10px] font-bold text-red-700 uppercase">Adiantamentos (-)</Label>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xl font-black text-red-900">
                        -{formatCurrency(data.totals.advancesInCents)}
                      </div>
                      <p className="text-[9px] text-red-600 font-medium">Vales no período</p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary bg-primary/5">
                    <CardHeader className="p-4 pb-1">
                      <Label className="text-[10px] font-bold text-primary uppercase">Sistema: Líquido</Label>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-black text-primary">
                        {formatCurrency(data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.netCompensationInCents || 0) : 0) - data.totals.advancesInCents)}
                      </div>
                      <p className="text-[9px] text-primary/70 font-bold uppercase tracking-tighter">Base para conferência</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Formulário de Registro */}
                  <Card className="shadow-lg border-primary/20 flex-1 flex flex-col">
                    <CardHeader className="bg-muted/30 py-3 shrink-0">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        {editingPaymentId ? "Editar Pagamento de Holerite" : "Registrar Pagamento de Holerite"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentDate" className="text-[10px] font-bold uppercase text-muted-foreground">Data do Pagamento</Label>
                          <Input 
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="h-9 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="holeriteValue" className="text-[10px] font-bold uppercase text-muted-foreground">Valor Líquido (Holerite)</Label>
                          <Input 
                            id="holeriteValue"
                            placeholder="R$ 0,00"
                            value={formatCentsToReal(holeriteValue)}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              setHoleriteValue(Number(value))
                            }}
                            className="h-9 bg-muted/30 focus:ring-1 focus:ring-primary/20 text-sm"
                          />
                        </div>

                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentNotes" className="text-[10px] font-bold uppercase text-muted-foreground">Observações</Label>
                        <Textarea 
                          id="paymentNotes"
                          placeholder="Pagamento referente ao mês de Abril..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="min-h-[80px] text-sm focus:ring-primary/20"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 border-dashed border-primary/20">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] font-bold uppercase text-primary">Marcar como Pago</Label>
                          <p className="text-[9px] text-muted-foreground">O pagamento já foi realizado?</p>
                        </div>
                        <Switch 
                          checked={isPaidNow}
                          onCheckedChange={setIsPaidNow}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        {editingPaymentId && (
                          <Button 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            className="h-10 font-bold"
                            disabled={isSubmittingPayment}
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button 
                          onClick={handleRegisterPayment} 
                          className="flex-1 h-10 font-bold gap-2"
                          disabled={isSubmittingPayment}
                        >
                          {isSubmittingPayment ? "Salvando..." : (editingPaymentId ? "Atualizar Pagamento" : "Salvar Pagamento")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados Bancários Assistidos e Último Registro */}
                  <div className="space-y-6 flex-1 flex flex-col">
                    <Card className="border-muted shadow-sm overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3 shrink-0">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          Dados Bancários Selecionados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {data.employee.accounts.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4">Nenhuma conta cadastrada.</div>
                        ) : (
                          <div className="space-y-3">
                            {data.employee.accounts.map(acc => (
                              <div key={acc.id} className={cn(
                                "p-3 rounded-lg border transition-all flex items-center justify-between",
                                acc.isDefault ? "bg-background border-primary/30 shadow-md" : "bg-background/20 hover:bg-background transition-colors"
                              )}>
                                <div className="flex gap-3 items-center min-w-0">
                                  <div className="p-2 rounded-full bg-primary/5 text-primary shrink-0">
                                    {acc.type === "BANCARIA" ? <Landmark className="size-4" /> : <QrCode className="size-4" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[9px] uppercase font-bold text-muted-foreground leading-none">
                                        {acc.type.replace("PIX_", "").replace("_", " ")}
                                        {acc.isDefault && <span className="text-primary ml-1">(PADRÃO)</span>}
                                      </p>
                                    </div>
                                    <p className="text-sm font-mono font-bold tracking-tight truncate py-0.5">
                                      {formatAccountIdentifier(acc.identifier, acc.type)}
                                    </p>
                                    
                                    {/* Informações adicionais do funcionário */}
                                    {((acc.type === "BANCARIA") || (acc.type === "PIX_TELEFONE")) && (
                                      <div className="mt-1 space-y-0.5">
                                        <p className="text-[9px] font-medium text-muted-foreground truncate uppercase">{data.employee.name}</p>
                                        {data.employee.document && (
                                          <p className="text-[9px] font-mono text-muted-foreground">CPF: {data.employee.document}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleCopy(acc.identifier, "Chave")}
                                  className="size-7 hover:bg-primary/10 hover:text-primary shrink-0"
                                >
                                  <Copy className="size-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Último Registro de Pagamento */}
                    {data.details.payments.length > 0 && (
                      <Card className="border-muted shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-3 shrink-0 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            Último Registro de Pagamento
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const defaultAcc = data.employee.accounts.find(acc => acc.isDefault) || data.employee.accounts[0]
                              const isPixCompatible = defaultAcc && defaultAcc.type !== "BANCARIA"
                              
                              if (!isPixCompatible) return null

                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => handleOpenPix(data.details.payments[0].id, data.details.payments[0].holeriteNetInCents)}
                                      >
                                        <QrCode className="size-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Gerar QR Code Pix</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            })()}
                            <Badge 
                              variant={data.details.payments[0].isPaid ? "default" : "outline"}
                              className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5",
                                data.details.payments[0].isPaid ? "bg-green-500 hover:bg-green-600 text-white" : "bg-orange-50 text-orange-600 border-orange-200"
                              )}
                            >
                              {data.details.payments[0].isPaid ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xl font-black text-primary">
                                {formatCurrency(data.details.payments[0].holeriteNetInCents)}
                              </div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-1">
                                <Calendar className="size-3" /> {format(parseLocalDate(data.details.payments[0].date), "dd/MM/yyyy")}
                              </div>
                              {data.details.payments[0].notes && (
                                <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">"{data.details.payments[0].notes}"</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTogglePaymentPaid(data.details.payments[0].id, data.details.payments[0].isPaid)}
                              className={cn(
                                "h-8 text-[10px] font-bold uppercase gap-2 transition-all",
                                data.details.payments[0].isPaid 
                                  ? "text-orange-600 border-orange-200 hover:bg-orange-50" 
                                  : "text-green-600 border-green-200 hover:bg-green-50"
                              )}
                            >
                              {data.details.payments[0].isPaid ? "Marcar como Pendente" : "Marcar como Pago"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Histórico de Pagamentos de Holerite */}
                <Card className="shadow-md border-muted overflow-hidden">
                  <CardHeader className="bg-muted/30 py-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      Histórico de Pagamentos (Holerite)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[120px]">Data</TableHead>
                          <TableHead className="text-right">Sistema (Bruto)</TableHead>
                          <TableHead className="text-right">Sistema (Líquido)</TableHead>
                          <TableHead className="text-right font-black text-primary">Holerite (Líquido)</TableHead>
                          <TableHead>Obs</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.details.payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum pagamento registrado ainda.</TableCell>
                          </TableRow>
                        ) : (
                          data.details.payments.map((p) => {
                            const diff = p.holeriteNetInCents - p.systemNetInCents
                            const diffPerc = Math.abs(diff / (p.systemNetInCents || 1) * 100)

                            return (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">{format(parseLocalDate(p.date), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(p.systemBrutoInCents)}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(p.systemNetInCents)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-black text-primary underline underline-offset-2">{formatCurrency(p.holeriteNetInCents)}</span>
                                    {diffPerc > 5 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-0.5 mt-0.5 border-orange-200 text-orange-600 animate-pulse">
                                              <AlertCircle className="size-2 mr-0.5" /> Divergência {diffPerc.toFixed(0)}%
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            A diferença entre o holerite e o sistema é de {formatCurrency(Math.abs(diff))}.
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={p.notes || ""}>{p.notes}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        className="cursor-pointer" 
                                        onClick={() => handleEditPayment(p)}
                                      >
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                                        onClick={() => handleDeletePayment(p.id)}
                                      >
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </DialogContent>

      {/* Pix QR Code Dialog */}
      <Dialog open={pixDialogOpen} onOpenChange={(open) => { setPixDialogOpen(open); if (!open) { setPixQrCode(null); setPixPayload(null); setPixError(null) } }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 pb-4 border-b bg-muted/20">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <QrCode className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">QR Code Pix</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Escaneie com qualquer app bancário
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-col gap-6 p-6">
              {/* Employee + key info */}
              <div className="space-y-4">
                {/* Beneficiário */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beneficiário</Label>
                  <p className="text-sm font-semibold">{pixEmployeeName}</p>
                </div>

                {/* Chave Pix */}
                <div className="space-y-1.5">
                  <Label htmlFor="pix-key-input" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Chave Pix {pixKeyType && `(${pixKeyType.replace("PIX_", "").replace("_", " ")})`}
                  </Label>
                  <Input
                    id="pix-key-input"
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => { 
                      const val = e.target.value
                      const formatted = formatPixKey(val, pixKeyType)
                      setPixKey(formatted)
                      setPixQrCode(null)
                      setPixPayload(null)
                      setPixError(null) 
                    }}
                    className="h-10 text-sm font-mono"
                  />
                </div>

                {/* Valor + Botão */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/15">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor</p>
                      <p className="text-xl font-black text-primary tracking-tight">{formatCentsToReal(pixAmount * 100)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <p className="font-medium">Pix</p>
                      <p>à vista</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGeneratePix}
                    disabled={isLoadingPix || !pixKey.trim()}
                    className="w-full"
                  >
                    {isLoadingPix ? "Gerando..." : pixQrCode ? "Gerar novamente" : "Gerar QR Code"}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {pixError && !isLoadingPix && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-sm leading-snug">{pixError}</p>
                </div>
              )}

              {/* QR Code result */}
              {pixQrCode && !isLoadingPix && (
                <div ref={qrCodeRef} className="flex flex-col items-center gap-8">
                  <div className="p-3 border-2 border-muted rounded-2xl bg-white shadow-md">
                    <img
                      src={pixQrCode}
                      alt="QR Code Pix"
                      className="size-52"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCopyPixCode}
                  >
                    Copiar código PIX
                  </Button>

                  {pixPayload && (
                    <div className="w-full">
                      <p className="text-[9px] text-muted-foreground mb-1.5 font-bold uppercase text-center tracking-wider">Código copia e cola</p>
                      <code className="text-[9px] font-mono bg-muted/60 rounded-lg p-3 block break-all w-full text-left leading-relaxed border">
                        {pixPayload}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
