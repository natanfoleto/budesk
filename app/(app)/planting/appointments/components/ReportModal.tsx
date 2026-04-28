"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, FileArchive, Files, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployeeTags } from "@/hooks/use-employee-tags"
import { cn } from "@/lib/utils"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  seasonId: string
  startDate: string
  endDate: string
  isMonthClosed?: boolean
  monthStr?: string
}

export function ReportModal({ isOpen, onClose, seasonId, startDate, endDate, isMonthClosed, monthStr }: ReportModalProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false)
  const [isGeneratingNoComp, setIsGeneratingNoComp] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>("all")
  const { data: tags } = useEmployeeTags()
  const isAnyGenerating = !!isGenerating || isGeneratingMonthly || isGeneratingNoComp

  const handleDownload = async (
    type: "individual" | "consolidated" | "all-zip", 
    employeeId?: string, 
    isMonthly?: boolean, 
    shouldCompensate: boolean = true
  ) => {
    setIsGenerating(type)
    if (isMonthly) setIsGeneratingMonthly(true)
    if (!shouldCompensate) setIsGeneratingNoComp(true)
    
    try {
      const params = new URLSearchParams({
        type,
        seasonId,
        startDate,
        endDate
      })
      if (employeeId) params.set("employeeId", employeeId)
      if (isMonthly) params.set("isMonthly", "true")
      if (!shouldCompensate) params.set("shouldCompensate", "false")
      if (selectedTagId !== "all") params.set("tagId", selectedTagId)

      const response = await fetch(`/api/planting/reports?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Manual session clear/redirect could be done here, 
          // but for now we'll just let the user know.
          // In a real app, we might want to trigger a global event or store change.
        }
        const err = await response.json()
        throw new Error(err.error || "Erro ao gerar relatório")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      let finalStartDate = startDate
      let finalEndDate = endDate
      if (isMonthly) {
        const d = new Date(startDate + "T12:00:00")
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        finalStartDate = firstDay.toISOString().split("T")[0]
        finalEndDate = lastDay.toISOString().split("T")[0]
      }
      const periodType = isMonthly ? "mensal" : "quinzenal"
      const dateRangeSuffix = `${finalStartDate}_${finalEndDate}`

      const filename = type === "all-zip" 
        ? `relatorios_individuais_plantio_${periodType}${shouldCompensate ? "" : "_sc"}_${dateRangeSuffix}.zip`
        : type === "consolidated"
          ? `relatorio_geral_plantio_${periodType}_${dateRangeSuffix}.pdf`
          : `relatorio_individual_plantio_${periodType}${shouldCompensate ? "" : "_sc"}_${dateRangeSuffix}.pdf`
      
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Relatório gerado com sucesso!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error(message)
    } finally {
      setIsGenerating(null)
      setIsGeneratingMonthly(false)
      setIsGeneratingNoComp(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatórios PDF</DialogTitle>
          <DialogDescription>
            {monthStr ? `Referência: ${format(new Date(monthStr + "-01T12:00:00"), "MMMM yyyy", { locale: ptBR })}` : ""}
            <br />
            Período: {format(new Date(startDate + "T12:00:00"), "dd/MM/yyyy")} a {format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Filtrar por Etiqueta (opcional)</Label>
          <Select value={selectedTagId} onValueChange={setSelectedTagId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as etiquetas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etiquetas</SelectItem>
              {tags?.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-6 pb-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Relatório Quinzenal</h4>
            <div className="grid gap-3">
              <Card 
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50",
                  isAnyGenerating && "opacity-50 pointer-events-none"
                )}
                onClick={() => !isAnyGenerating && handleDownload("consolidated")}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Quinzenal Consolidado</h4>
                    <p className="text-[10px] text-muted-foreground text-pretty line-clamp-1">Todos os funcionários agrupados.</p>
                  </div>
                  {isGenerating === "consolidated" && !isGeneratingMonthly ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-amber-500/50",
                    isAnyGenerating && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => !isAnyGenerating && handleDownload("all-zip")}
                >
                  <CardContent className="flex flex-col items-center text-center gap-2 p-3">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[13px]">Individuais (ZIP)</h4>
                      <p className="text-[9px] text-muted-foreground">Padrão</p>
                    </div>
                    {isGenerating === "all-zip" && !isGeneratingMonthly && !isGeneratingNoComp ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="h-3 w-3 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>

                <Card 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-orange-500/50",
                    isAnyGenerating && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => !isAnyGenerating && handleDownload("all-zip", undefined, false, false)}
                >
                  <CardContent className="flex flex-col items-center text-center gap-2 p-3">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[13px]">Individuais <span className="text-orange-600">sem compensação</span></h4>
                      <p className="text-[9px] text-muted-foreground">Simplificado</p>
                    </div>
                    {isGenerating === "all-zip" && !isGeneratingMonthly && isGeneratingNoComp ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="h-3 w-3 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Relatório Mensal</h4>
              {!isMonthClosed && (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200 uppercase tracking-tighter">
                  Fechamento Pendente
                </span>
              )}
            </div>

            <div className={cn("grid gap-3", !isMonthClosed && "opacity-60 grayscale pointer-events-none")}>
              <Card 
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors border-2",
                  (isMonthClosed && !isAnyGenerating) ? "hover:border-emerald-500/50" : "cursor-not-allowed opacity-50 pointer-events-none"
                )}
                onClick={() => isMonthClosed && !isAnyGenerating && handleDownload("consolidated", undefined, true)}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Mensal Consolidado</h4>
                    <p className="text-[10px] text-muted-foreground">Resumo completo do mês.</p>
                  </div>
                  {isGeneratingMonthly && isGenerating === "consolidated" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors border-2",
                    (isMonthClosed && !isAnyGenerating) ? "hover:border-emerald-500/50" : "cursor-not-allowed opacity-50 pointer-events-none"
                  )}
                  onClick={() => isMonthClosed && !isAnyGenerating && handleDownload("all-zip", undefined, true)}
                >
                  <CardContent className="flex flex-col items-center text-center gap-2 p-3">
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[13px]">Individuais (ZIP)</h4>
                      <p className="text-[9px] text-muted-foreground">Padrão Mensal</p>
                    </div>
                    {isGeneratingMonthly && isGenerating === "all-zip" && !isGeneratingNoComp ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="h-3 w-3 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>

                <Card 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors border-2",
                    (isMonthClosed && !isAnyGenerating) ? "hover:border-orange-500/50" : "cursor-not-allowed opacity-50 pointer-events-none"
                  )}
                  onClick={() => isMonthClosed && !isAnyGenerating && handleDownload("all-zip", undefined, true, false)}
                >
                  <CardContent className="flex flex-col items-center text-center gap-2 p-3">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                      <FileArchive className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[13px]">Individuais <span className="text-orange-600">sem compensação</span></h4>
                      <p className="text-[9px] text-muted-foreground">Simplificado Mensal</p>
                    </div>
                    {isGeneratingMonthly && isGenerating === "all-zip" && isGeneratingNoComp ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="h-3 w-3 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {!isMonthClosed && (
              <p className="text-[11px] text-center text-red-600 px-1">
                As duas quinzenas precisam estar fechadas para gerar o relatório mensal.
              </p>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground px-1 mt-2">
            O cálculo de Total Líquido desconta automaticamente os Adiantamentos marcados para "Descontar na quinzena atual".
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAnyGenerating}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
