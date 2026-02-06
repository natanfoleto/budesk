"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Separator } from "@/components/ui/separator"

import { AuditTable } from "./_components/audit-table"

// Type definition matches local usage in AuditTable, ideally should be shared
// but duplication here is fine if it avoids extra files just for this
type AuditLog = {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN"
  entity: string
  entityId: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
}

export default function AuditPage() {
  const [data, setData] = useState<AuditLog[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/audit")
        if (!response.ok) throw new Error("Failed to fetch logs")
        const result = await response.json()
        setData(result.data) 
      } catch (error) {
        console.error(error)
        toast.error("Erro ao carregar auditoria")
      }
    }
    fetchData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Auditoria</h2>
        <p className="text-muted-foreground">
          Visualize o histórico de ações e alterações no sistema.
        </p>
      </div>
      <Separator />
      
      <AuditTable logs={data} />
    </div>
  )
}
