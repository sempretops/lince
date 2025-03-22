"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { processarArquivos } from "@/features/upload/actions/processar-arquivos"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UploadIcon } from "lucide-react"

export function Upload() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csvFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      })
      return
    }

    if (!imageFiles || imageFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos uma imagem.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("csv", csvFile)

      for (let i = 0; i < imageFiles.length; i++) {
        formData.append("images", imageFiles[i])
      }

      const result = await processarArquivos(formData)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `${result.registrosProcessados} registros processados com sucesso.`,
        })

        // Limpar os campos após o processamento
        setCsvFile(null)
        setImageFiles(null)

        // Recarregar a página para atualizar a dashboard
        window.location.reload()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Ocorreu um erro ao processar os arquivos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar os arquivos.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Arquivos</CardTitle>
        <CardDescription>Faça o upload do arquivo CSV e das imagens dos veículos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv">Arquivo CSV</Label>
            <Input id="csv" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            <p className="text-sm text-muted-foreground">
              O arquivo CSV deve ter o formato: Data hora[tab]Velocidade[tab]ID
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="images">Imagens</Label>
            <Input
              id="images"
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
            />
            <p className="text-sm text-muted-foreground">
              As imagens devem ter nomes no formato: YYYY-MM-DD HH MM SS.jpg
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isProcessing} className="ml-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                Processar Arquivos
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 