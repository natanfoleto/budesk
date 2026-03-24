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

  const handleDownload = async (type: "individual" | "consolidated" | "all-zip", employeeId?: string, isMonthly?: boolean) => {
    if (isMonthly) setIsGeneratingMonthly(true)
    else setIsGenerating(type)
    
    try {
      const params = new URLSearchParams({
        type,
        seasonId,
        startDate,
        endDate
      })
      if (employeeId) params.set("employeeId", employeeId)
      if (isMonthly) params.set("isMonthly", "true")

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
        ? `relatorios_individuais_plantio_${periodType}_${dateRangeSuffix}.zip`
        : type === "consolidated"
          ? `relatorio_geral_plantio_${periodType}_${dateRangeSuffix}.pdf`
          : `relatorio_individual_plantio_${periodType}_${dateRangeSuffix}.pdf`
      
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

        <div className="grid grid-cols-1 gap-6 py-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Relatório Quinzenal</h4>
            <div className="grid gap-3">
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
                onClick={() => !isGenerating && handleDownload("consolidated")}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Quinzenal Consolidado</h4>
                    <p className="text-[10px] text-muted-foreground text-pretty line-clamp-1">Todos os funcionários agrupados.</p>
                  </div>
                  {isGenerating === "consolidated" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
                onClick={() => !isGenerating && handleDownload("all-zip")}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Quinzenal Individuais (ZIP)</h4>
                    <p className="text-[10px] text-muted-foreground">PDFs separados por funcionário.</p>
                  </div>
                  {isGenerating === "all-zip" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
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
                  isMonthClosed ? "hover:border-emerald-500/50" : "cursor-not-allowed opacity-50"
                )}
                onClick={() => isMonthClosed && !isGeneratingMonthly && handleDownload("consolidated", undefined, true)}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <Files className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Mensal Consolidado</h4>
                    <p className="text-[10px] text-muted-foreground">Resumo completo do mês.</p>
                  </div>
                  {isGeneratingMonthly && isGenerating === null ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors border-2",
                  isMonthClosed ? "hover:border-emerald-500/50" : "cursor-not-allowed opacity-50"
                )}
                onClick={() => isMonthClosed && !isGeneratingMonthly && handleDownload("all-zip", undefined, true)}
              >
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Mensal Individuais (ZIP)</h4>
                    <p className="text-[10px] text-muted-foreground">PDFs do mês separados por funcionário.</p>
                  </div>
                  {isGeneratingMonthly && isGenerating === "all-zip" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            </div>

            {!isMonthClosed && (
              <p className="text-[11px] text-center text-red-600 px-1 italic">
                As duas quinzenas precisam estar fechadas para gerar o relatório mensal.
              </p>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground px-1 mt-2">
            O cálculo de Total Líquido desconta automaticamente os Adiantamentos marcados para "Descontar na quinzena atual".
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
