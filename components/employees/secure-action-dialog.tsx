"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SecureActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  title: string
  description?: string
  actionType?: "delete" | "update"
}

export function SecureActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  actionType = "delete"
}: SecureActionDialogProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError("Digite sua senha para continuar.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || "Senha incorreta.")
        setIsLoading(false)
        return
      }

      await onConfirm()
      setPassword("")
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError("Erro ao processar solicitação. Tente novamente.")
      toast.error("Erro ao verificar senha.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword("")
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2" asChild>
            <div className="text-muted-foreground text-sm">
              <p>
                {description || "Esta ação é sensível e requer confirmação."}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <form onSubmit={handleConfirm} className="space-y-4 my-4">
          <div className="space-y-2">
            <Label htmlFor="password">Confirme sua senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? "border-red-500" : ""}
              autoFocus
            />
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isLoading}>Cancelar</AlertDialogCancel>
            <Button 
              type="submit" 
              variant={actionType === "delete" ? "destructive" : "default"}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionType === "delete" ? "Excluir permanentemente" : "Confirmar alteração"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
