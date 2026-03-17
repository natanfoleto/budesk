"use client"

import { format } from "date-fns"
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

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  seasonId: string
  startDate: string
  endDate: string
}

export function ReportModal({ isOpen, onClose, seasonId, startDate, endDate }: ReportModalProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const handleDownload = async (type: "individual" | "consolidated" | "all-zip", employeeId?: string) => {
    setIsGenerating(type)
    try {
      const params = new URLSearchParams({
        type,
        seasonId,
        startDate,
        endDate
      })
      if (employeeId) params.set("employeeId", employeeId)

      const response = await fetch(`/api/planting/reports?${params.toString()}`)
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Erro ao gerar relatório")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      
      const filename = type === "all-zip" 
        ? `relatorios_individuais_plantio_${startDate}_${endDate}.zip`
        : type === "consolidated"
          ? `relatorio_geral_plantio_${startDate}_${endDate}.pdf`
          : `relatorio_individual_plantio_${startDate}_${endDate}.pdf`
      
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
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatórios da Quinzena</DialogTitle>
          <DialogDescription>
            Período: {format(new Date(startDate + "T12:00:00"), "dd/MM/yyyy")} a {format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
            onClick={() => !isGenerating && handleDownload("consolidated")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Files className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">Relatório Geral Consolidado</h4>
                <p className="text-sm text-muted-foreground">Todos os funcionários em uma única tabela.</p>
              </div>
              {isGenerating === "consolidated" ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Download className="h-5 w-5 text-muted-foreground" />
              )}
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
            onClick={() => !isGenerating && handleDownload("all-zip")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                <FileArchive className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">Download Todos Individuais (ZIP)</h4>
                <p className="text-sm text-muted-foreground">Gera um PDF individual para cada funcionário.</p>
              </div>
              {isGenerating === "all-zip" ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Download className="h-5 w-5 text-muted-foreground" />
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1 mt-2">
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
