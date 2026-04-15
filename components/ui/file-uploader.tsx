"use client"

import { FileIcon, Loader2, UploadCloud, View, X } from "lucide-react"
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
  const [isDragOver, setIsDragOver] = React.useState(false)
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const isImage = value ? /\.(jpg|jpeg|png|webp|gif)$/i.test(value) : false

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex flex-col gap-2 rounded-md border p-2 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {isImage ? (
                <div className="h-8 w-8 rounded overflow-hidden shrink-0 border bg-background/50 flex items-center justify-center">
                  <img src={value} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <FileIcon className="h-4 w-4 shrink-0 text-primary" />
              )}
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
                <View className="h-4 w-4" />
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
          {isImage && (
            <div className="flex justify-center mt-1 border-t pt-2">
              <img src={value} alt="Preview" className="max-h-24 object-contain rounded" />
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors
            ${disabled || isUploading ? 'bg-muted cursor-not-allowed' : 'hover:bg-accent hover:border-primary cursor-pointer border-muted-foreground/25'}
            ${isDragOver ? 'bg-accent border-primary' : ''}
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
              <UploadCloud className={`mb-2 h-6 w-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-center text-xs ${isDragOver ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label || (isDragOver ? "Solte o arquivo aqui" : "Clique ou arraste um arquivo aqui")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
