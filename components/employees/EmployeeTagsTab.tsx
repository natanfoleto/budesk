import { Flag, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEmployeeTagAssignment, useEmployeeTags } from "@/hooks/use-employee-tags"
import { cn } from "@/lib/utils"

import { TagManagementModal } from "./TagManagementModal"

interface EmployeeTagsTabProps {
  employeeId: string
}

export const EmployeeTagsTab = ({ employeeId }: EmployeeTagsTabProps) => {
  const { data: allTags = [], isLoading: isLoadingAllTags } = useEmployeeTags()
  const { data: employeeTags = [], isLoading: isLoadingAssignment, syncTags, isSyncing } = useEmployeeTagAssignment(employeeId)

  const handleToggleTag = (tagId: string) => {
    const isAssigned = employeeTags.some(t => t.id === tagId)
    let newTagIds: string[]

    if (isAssigned) {
      newTagIds = employeeTags.filter(t => t.id !== tagId).map(t => t.id)
    } else {
      newTagIds = [...employeeTags.map(t => t.id), tagId]
    }

    syncTags(newTagIds)
  }

  if (isLoadingAllTags || isLoadingAssignment) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground size-8" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Etiquetas do Funcionário
            </CardTitle>
            <CardDescription className="mt-1">
              Clique nas etiquetas para ativar ou desativar neste funcionário.
            </CardDescription>
          </div>
          <TagManagementModal />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allTags.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Flag className="size-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-muted-foreground">Nenhuma etiqueta criada</h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Use o botão acima para criar etiquetas globais que podem ser usadas em todos os funcionários.
              </p>
            </div>
          ) : (
            allTags.map((tag) => {
              const isActive = employeeTags.some(t => t.id === tag.id)
              
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  disabled={isSyncing}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "bg-accent/40 border-primary shadow-md ring-1 ring-primary/20 scale-[1.02]" 
                      : "bg-muted/30 border-transparent hover:border-muted-foreground/20 hover:bg-muted/40",
                    isSyncing && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {/* Color strip indicator */}
                  <div 
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5 transition-opacity",
                      isActive ? "opacity-100" : "opacity-30 group-hover:opacity-100"
                    )}
                    style={{ backgroundColor: tag.color }}
                  />
                  
                  <div 
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isActive ? "bg-opacity-100" : "bg-opacity-20 group-hover:bg-opacity-100"
                    )}
                    style={{ 
                      backgroundColor: isActive ? tag.color : `${tag.color}33`,
                      color: isActive ? '#fff' : tag.color 
                    }}
                  >
                    <Flag className={cn("size-4", isActive ? "fill-current" : "")} />
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-sm font-semibold truncate transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {tag.name}
                    </span>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold transition-colors",
                      isActive ? "text-primary/90" : "text-muted-foreground/60"
                    )}>
                      {isActive ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  {isSyncing && isActive && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="animate-spin text-primary size-2.5" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {isSyncing && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary font-medium bg-primary/5 py-2 rounded-full animate-pulse">
            <Loader2 className="animate-spin size-4" />
            Salvando alterações...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
