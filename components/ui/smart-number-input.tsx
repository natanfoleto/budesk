"use client"

import { Calculator } from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SmartNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  onKeyDownCustom?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function SmartNumberInput({ 
  value, 
  onChange, 
  onKeyDownCustom,
  className, 
  disabled,
  placeholder,
  ...props 
}: SmartNumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value > 0 ? value.toString() : "")
  const [isFocused, setIsFocused] = useState(false)
  const [isCalculated, setIsCalculated] = useState(false)

  // Sync internal state when external value changes (unless focused)
  useEffect(() => {
    if (!isFocused) {
      const valStr = value > 0 ? value.toString() : ""
      setDisplayValue(valStr)
      // Reset isCalculated if it was just a manual override or load
      if (!valStr.includes("+")) {
        setIsCalculated(false)
      }
    }
  }, [value, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow only numbers and plus sign
    if (/^[0-9+]*$/.test(val)) {
      setDisplayValue(val)
    }
  }

  const processValue = () => {
    if (!displayValue) {
      onChange(0)
      setIsCalculated(false)
      return
    }

    // Validation: Check for invalid formats like "100++", "+100", "100+"
    const isValidFormat = /^\d+(\+\d+)*$/.test(displayValue)
    
    if (!isValidFormat) {
      if (displayValue.includes("+")) {
        toast.error("Formato inválido. Use apenas números ou somas (ex: 100+100).")
        // Revert to current prop value
        setDisplayValue(value > 0 ? value.toString() : "")
      } else {
        onChange(0)
      }
      setIsCalculated(false)
      return
    }

    if (displayValue.includes("+")) {
      const sum = displayValue
        .split("+")
        .map(part => parseInt(part, 10))
        .reduce((acc, curr) => acc + curr, 0)
      
      onChange(sum)
      setIsCalculated(true)
      // Keep displayValue as the expression for next focus
    } else {
      onChange(parseInt(displayValue, 10))
      setIsCalculated(false)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    processValue()
    if (props.onBlur) props.onBlur(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processValue()
    }
    if (onKeyDownCustom) {
      onKeyDownCustom(e)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    e.target.select()
    if (props.onFocus) props.onFocus(e)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            <Input
              {...props}
              type="text" // Change to text to allow "+"
              className={cn(
                "h-8 text-center transition-colors px-6",
                isCalculated && !isFocused && "bg-blue-50/50 border-blue-200 text-blue-700 font-semibold",
                className
              )}
              value={isFocused ? displayValue : (isCalculated ? value : displayValue)}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder || "0"}
            />
            {isCalculated && !isFocused && (
              <Calculator className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400 opacity-50 group-hover:opacity-100" />
            )}
          </div>
        </TooltipTrigger>
        {isCalculated && !isFocused && (
          <TooltipContent side="top">
            <p className="text-[10px]">Calculado automaticamente: <span className="font-mono">{displayValue}</span></p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
