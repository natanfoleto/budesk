import { Tag } from "lucide-react"
import React from "react"

import { cn } from "@/lib/utils"

interface TagBadgeProps {
  name: string
  color: string
  className?: string
  showIcon?: boolean
}

export const TagBadge = ({ name, color, className, showIcon = true }: TagBadgeProps) => {
  const getContrastColor = (hexColor: string) => {
    // Basic contrast calculation
    const hex = hexColor.replace("#", "")
    if (hex.length !== 6) return "white" // Fallback
    
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6 ? "black" : "white"
  }

  const textColor = getContrastColor(color)

  return (
    <div
      style={{
        backgroundColor: color,
        color: textColor,
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm border border-black/5 transition-all hover:brightness-110",
        className
      )}
    >
      {showIcon && <Tag className="size-2.5 stroke-[2.5]" />}
      <span className="truncate max-w-[120px] pb-[1px]">{name}</span>
    </div>
  )
}
