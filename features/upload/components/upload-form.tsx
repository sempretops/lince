"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { processarArquivos } from "../actions/processar-arquivos"
import { toast } from "sonner"

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB por chunk

async function uploadFileInChunks(file: File, onProgress: (progress: number) => void) {
  const chunks = Math.ceil(file.size / CHUNK_SIZE)
  const formData = new FormData()

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    formData.append(`chunk_${i}`, chunk)
    formData.append("filename", file.name)
    formData.append("totalChunks", chunks.toString())
    formData.append("currentChunk", i.toString())

    // Simular progresso
    onProgress((i + 1) / chunks * 100)
    await new Promise(resolve => setTimeout(resolve, 100)) // Pequeno delay para não sobrecarregar
  }

  return formData
}

export function UploadForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData(e.currentTarget)
      const csvFile = formData.get("csv") as File
      const imageFiles = formData.getAll("images") as File[]

      if (!csvFile || imageFiles.length === 0) {
        toast.error("Por favor, selecione os arquivos CSV e as imagens")
        return
      }

      // Processar cada arquivo em chunks
      const processedFormData = new FormData()
      processedFormData.append("csv", csvFile)

      for (const imageFile of imageFiles) {
        const imageFormData = await uploadFileInChunks(imageFile, (progress) => {
          setProgress(progress)
        })
        processedFormData.append("images", imageFile)
      }

      const result = await processarArquivos(processedFormData)

      if (result.success) {
        toast.success(`Upload concluído! ${result.registrosProcessados} registros processados.`)
        if (result.erros) {
          console.warn("Alguns erros ocorreram:", result.erros)
          toast.warning("Alguns erros ocorreram durante o processamento. Verifique o console para mais detalhes.")
        }
      } else {
        toast.error(result.error || "Erro ao processar arquivos")
      }
    } catch (error) {
      console.error("Erro durante o upload:", error)
      toast.error("Erro ao fazer upload dos arquivos")
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="csv">Arquivo CSV</Label>
        <Input
          id="csv"
          name="csv"
          type="file"
          accept=".csv"
          required
          disabled={isUploading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="images">Imagens</Label>
        <Input
          id="images"
          name="images"
          type="file"
          accept="image/*"
          multiple
          required
          disabled={isUploading}
        />
      </div>
      {isUploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">Upload em andamento... {Math.round(progress)}%</p>
        </div>
      )}
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Enviando..." : "Enviar Arquivos"}
      </Button>
    </form>
  )
} 