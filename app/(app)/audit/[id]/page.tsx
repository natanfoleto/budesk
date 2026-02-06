
"use client"

import { format } from "date-fns"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { AuditDiffViewer } from "../_components/audit-diff-viewer"

type AuditLogDetail = {
  id: string
  action: string
  entity: string
  entityId: string
  oldData: any
  newData: any
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
}

export default function AuditDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [log, setLog] = useState<AuditLogDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchLog = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/audit/${id}`)
        if (!response.ok) throw new Error("Log not found")
        const data = await response.json()
        setLog(data)
      } catch (error) {
        console.error(error)
        // router.push("/audit") // Redirect if error?
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!log) {
    return (
      <div className="p-8">
        <p>Log não encontrado.</p>
        <Button variant="link" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Detalhes da Auditoria</h2>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID da Ação</p>
              <p className="font-mono text-sm">{log.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Ação</p>
              <Badge variant="outline">{log.action}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entidade</p>
              <p>{log.entity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuário Responsável</p>
              <p>{log.user ? `${log.user.name} (${log.user.email})` : "Sistema"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
              <p>{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Alterações</CardTitle>
            <CardDescription>Comparativo dos dados antes e depois da ação.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditDiffViewer oldData={log.oldData} newData={log.newData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
