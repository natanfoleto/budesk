"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface ReportSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string|null
  employeeName: string
  seasonId: string
  initialStartDate?: string
  initialEndDate?: string
}

export function ReportSelectionModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  seasonId,
  initialStartDate = "",
  initialEndDate = ""
}: ReportSelectionModalProps) {
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [shouldCompensate, setShouldCompensate] = useState<"true" | "false">("true")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadReport = async () => {
    if (!employeeId || !seasonId) return
    
    if (!startDate || !endDate) {
      toast.error("Selecione o período inicial e final.")
      return
    }

    setIsGenerating(true)
    try {
      const params = new URLSearchParams({
        type: "individual",
        employeeId,
        seasonId,
        startDate,
        endDate,
        shouldCompensate
      })

      const response = await fetch(`/api/planting/reports?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao gerar relatório")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const suffix = shouldCompensate === "false" ? "_sc" : ""
      a.download = `relatorio_individual_${employeeName.replace(/\s+/g, "_")}_${startDate}_${endDate}${suffix}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Relatório gerado com sucesso!")
      onOpenChange(false)
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Erro ao baixar relatório"
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Gerar Relatório Individual
          </DialogTitle>
          <DialogDescription>
            Selecione o período e o tipo de relatório para <strong>{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Modelo de Relatório</Label>
            <Select 
              value={shouldCompensate} 
              onValueChange={(val: "true" | "false") => setShouldCompensate(val)}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Com Compensação Financeira (Geral)</SelectItem>
                <SelectItem value="false">Sem Compensação (Valores Nominais)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-1">
              {shouldCompensate === "true" 
                ? "Calcula descontos automáticos de faltas e pagamentos de folgas baseados no salário base."
                : "Exibe apenas o total bruto dos serviços realizados e diárias explicitamente lançadas."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDownloadReport} 
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Gerar PDF"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
