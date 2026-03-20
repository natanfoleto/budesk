import { Filter, X } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEmployeeTags } from "@/hooks/use-employee-tags"
import { cn } from "@/lib/utils"

import { TagBadge } from "./TagBadge"

interface TagMultiSelectProps {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  placeholder?: string
  className?: string
}

export const TagMultiSelect = ({ 
  selectedTagIds, 
  onChange, 
  placeholder = "Filtrar por etiquetas",
  className 
}: TagMultiSelectProps) => {
  const { data: tags = [], isLoading } = useEmployeeTags()
  
  const handleToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id))

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 border-dashed flex gap-2 items-center min-w-[140px] justify-start px-3"
            disabled={isLoading}
          >
            <Filter className="text-muted-foreground size-3.5" />
            <span className="text-xs font-medium">
              {selectedTags.length > 0 
                ? `${selectedTags.length} selecionada(s)` 
                : placeholder
              }
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          <DropdownMenuLabel>Etiquetas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tags.length === 0 && !isLoading && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Nenhuma etiqueta encontrada
            </div>
          )}
          {tags.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag.id}
              checked={selectedTagIds.includes(tag.id)}
              onCheckedChange={() => handleToggle(tag.id)}
              className="gap-2"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: tag.color }} 
              />
              <span className="flex-1 truncate">{tag.name}</span>
            </DropdownMenuCheckboxItem>
          ))}
          
          {selectedTagIds.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-8 text-xs font-normal"
                  onClick={handleClear}
                >
                  Limpar filtros
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-wrap gap-1.5 max-w-[400px]">
        {selectedTags.map(tag => (
          <div key={tag.id} className="relative group">
            <TagBadge 
              name={tag.name} 
              color={tag.color} 
              className="pr-6" // Space for X button
            />
            <button
              onClick={() => handleToggle(tag.id)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
