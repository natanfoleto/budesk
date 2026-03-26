"use client"

import { Loader2, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  useCreateEmployeeTag, 
  useDeleteEmployeeTag, 
  useEmployeeTags, 
  useUpdateEmployeeTag 
} from "@/hooks/use-employee-tags"
import { useEmployees } from "@/hooks/use-employees"
import { cn } from "@/lib/utils"

import { TagBadge } from "./TagBadge"

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", 
  "#22c55e", "#10b981", "#06b6d4", "#0ea5e9", "#3b82f6", 
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", 
  "#f43f5e", "#64748b", "#78716c"
]

interface TagManagementModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTagId?: string | null
  trigger?: React.ReactNode
}

export const TagManagementModal = ({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  defaultTagId,
  trigger
}: TagManagementModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = externalOpen ?? internalOpen
  const setIsOpen = externalOnOpenChange ?? setInternalOpen

  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)

  // Bulk Assignment State
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

  const { data: allTags = [], isLoading } = useEmployeeTags()
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useEmployees({ limit: 1000, status: "ATIVO" })
  const allEmployees = useMemo(() => employeesResponse?.data || [], [employeesResponse])

  const { mutate: createTag, isPending: isCreating } = useCreateEmployeeTag()
  const { mutate: updateTag, isPending: isUpdating } = useUpdateEmployeeTag()
  const { mutate: deleteTag, isPending: isDeleting } = useDeleteEmployeeTag()

  // Initialize selected employees when editing
  useEffect(() => {
    if (editingId && allEmployees.length > 0) {
      const assignedIds = allEmployees
        .filter(emp => emp.tags?.some(t => t.id === editingId))
        .map(emp => emp.id)
      setSelectedEmployeeIds(assignedIds)
    } else if (!editingId) {
      setSelectedEmployeeIds([])
    }
  }, [editingId, allEmployees])

  // Set editing tag from prop
  useEffect(() => {
    if (isOpen && defaultTagId) {
      const tag = allTags.find(t => t.id === defaultTagId)
      if (tag) {
        setEditingId(tag.id)
        setName(tag.name)
        setColor(tag.color)
      }
    } else if (isOpen && !defaultTagId && !editingId) {
      resetForm()
    }
  }, [isOpen, defaultTagId, allTags])

  // Reset form when modal closes to guarantee a clean slate on next open
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm.trim()) return allEmployees
    const term = employeeSearchTerm.toLowerCase()
    return allEmployees.filter(emp => emp.name.toLowerCase().includes(term))
  }, [allEmployees, employeeSearchTerm])

  const handleCreateOrUpdate = () => {
    if (!name.trim()) {
      toast.error("O nome da etiqueta é obrigatório")
      return
    }

    if (editingId) {
      updateTag({ id: editingId, name, color, employeeIds: selectedEmployeeIds }, {
        onSuccess: () => {
          resetForm()
        }
      })
    } else {
      createTag({ name, color }, {
        onSuccess: () => {
          resetForm()
        }
      })
    }
  }

  const handleEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingId(tag.id)
    setName(tag.name)
    setColor(tag.color)
  }

  const handleDelete = (id: string) => {
    deleteTag(id, {
      onSuccess: () => setTagToDelete(null)
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setColor(PRESET_COLORS[0])
    setEmployeeSearchTerm("")
    setSelectedEmployeeIds([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : !externalOpen && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Gerenciar Etiquetas
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Etiquetas</DialogTitle>
          <DialogDescription>
            Crie, edite ou exclua etiquetas globais para categorizar seus funcionários.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Create/Edit Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-accent/10">
            <h4 className="text-sm font-semibold">
              {editingId ? "Editar Etiqueta" : "Nova Etiqueta"}
            </h4>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="tag-name">Nome</Label>
                <Input 
                  id="tag-name"
                  placeholder="Ex: Motorista, Destaque..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Cor</Label>

                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        "cursor-pointer w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                        color === c && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}

                  <div className="flex items-center ml-1">
                    <Input 
                      type="color" 
                      className="cursor-pointer w-8 h-8 p-1 border-none bg-transparent"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Pré-visualização:</p>
                <TagBadge name={name || "Exemplo"} color={color} />
              </div>

              {/* Bulk Assignment Section (Editing only) */}
              {editingId && (
                <div className="space-y-3 pt-2 border-t mt-4">
                  <Label className="text-sm font-semibold">Funcionários vinculados</Label>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Pesquisar funcionário..."
                      className="pl-9 h-9"
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="border rounded-md max-h-[200px] overflow-y-auto bg-accent/5">
                    {isLoadingEmployees ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin size-4 text-muted-foreground" />
                      </div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Nenhum funcionário encontrado.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredEmployees.map((emp) => (
                          <div 
                            key={emp.id} 
                            className="flex items-center gap-3 p-2 hover:bg-accent/20 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEmployeeIds(prev => 
                                prev.includes(emp.id)
                                  ? prev.filter(id => id !== emp.id)
                                  : [...prev, emp.id]
                              )
                            }}
                          >
                            <Checkbox 
                              checked={selectedEmployeeIds.includes(emp.id)}
                              onCheckedChange={() => {
                                // Handled by div onClick for better hit area
                              }}
                            />
                            <span className="text-sm">{emp.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground px-1">
                    {selectedEmployeeIds.length} funcionários selecionados
                  </div>
                </div>
              )}

             
                
              <div className="flex gap-2 justify-end">
                {editingId && (
                  <Button variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              
                <Button 
                  onClick={handleCreateOrUpdate} 
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating && (
                    <Loader2 className="animate-spin size-3.5" />
                  )}

                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </div>

          {/* List of Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold px-1">Etiquetas Existentes</h4>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground size-6" />
              </div>
            ) : allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma etiqueta cadastrada.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {allTags.map((tag) => (
                  <div 
                    key={tag.id} 
                    className="flex items-center justify-between py-2 px-3 rounded-md border group hover:bg-accent/50 transition-colors"
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                    <div className="flex gap-4">
                      <Button 
                        variant="link"
                        size="sm" 
                        className="h-auto p-0 text-xs"
                        onClick={() => handleEdit(tag)}
                        title="Editar"
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs"
                        onClick={() => setTagToDelete(tag.id)}
                        disabled={isDeleting}
                        title="Excluir"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A etiqueta será removida permanentemente e desvinculada de todos os funcionários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => tagToDelete && handleDelete(tagToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
