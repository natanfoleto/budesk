"use client"

import { Eye, FileIcon, Loader2, UploadCloud, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  label?: string
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  folder?: string
}

export function FileUploader({ label, value, onChange, disabled, folder = "financial" }: FileUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Erro ao fazer upload")

      const data = await response.json()
      onChange(data.url)
      toast.success("Arquivo enviado com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Falha ao enviar arquivo")
    } finally {
      setIsUploading(false)
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const removeFile = () => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center justify-between rounded-md border p-2 bg-muted/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs truncate font-medium flex-1 min-w-0">
              {value.split("/").pop()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Visualizar"
              onClick={() => window.open(value, "_blank")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Remover"
              onClick={removeFile}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors
            ${disabled || isUploading ? 'bg-muted cursor-not-allowed' : 'hover:bg-accent hover:border-primary cursor-pointer border-muted-foreground/25'}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-center text-xs text-muted-foreground">
                {label || "Clique para enviar arquivo"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
