import { Plus } from "lucide-react"
import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateEmployeeTag, useEmployeeTags } from "@/hooks/use-employee-tags"
import { cn } from "@/lib/utils"

import { TagBadge } from "./TagBadge"

interface TagSelectProps {
  value?: string
  onChange: (tagId: string) => void
  placeholder?: string
  className?: string
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", 
  "#f43f5e", "#64748b"
]

export const TagSelect = ({ value, onChange, placeholder = "Selecionar etiqueta...", className }: TagSelectProps) => {
  const { data: tags = [], isLoading } = useEmployeeTags()
  const createTag = useCreateEmployeeTag()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const handleCreate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!newName.trim()) return
    
    try {
      const tag = await createTag.mutateAsync({ name: newName, color: newColor })
      onChange(tag.id)
      setIsCreating(false)
      setNewName("")
    } catch {
      // Error handled by hook
    }
  }

  const selectedTag = tags.find(t => t.id === value)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedTag ? (
              <TagBadge name={selectedTag.name} color={selectedTag.color} />
            ) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border border-black/10" 
                  style={{ backgroundColor: tag.color }} 
                />
                <span>{tag.name}</span>
              </div>
            </SelectItem>
          ))}
          
          <div className="p-2 border-t mt-1">
            {!isCreating ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start h-8 text-xs gap-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsCreating(true)
                }}
              >
                <Plus className="size-3.5" />
                Nova Etiqueta
              </Button>
            ) : (
              <div className="space-y-2 py-1" onClick={e => e.stopPropagation()}>
                <Input 
                  placeholder="Nome..." 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110",
                        newColor === color && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="h-7 text-[10px] flex-1"
                    onClick={handleCreate}
                    disabled={createTag.isPending || !newName.trim()}
                  >
                    Criar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] flex-1"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}
