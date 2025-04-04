"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, AlertTriangle, Car } from "lucide-react"
import { obterRegistros } from "@/features/dashboard/actions/obter-registros"
import type { Registro } from "@/types/registro"
import Image from "next/image"

export function Dashboard() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<Registro[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await obterRegistros()
        setRegistros(data)
        setFilteredRegistros(data)
      } catch (error) {
        console.error("Erro ao carregar registros:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRegistros(registros)
    } else {
      const filtered = registros.filter(
        (registro) =>
          registro.dataHora.includes(searchTerm) ||
          registro.velocidade.toString().includes(searchTerm) ||
          (registro.placa && registro.placa.includes(searchTerm.toUpperCase())),
      )
      setFilteredRegistros(filtered)
    }
  }, [searchTerm, registros])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const formatarData = (dataHora: string) => {
    try {
      const data = new Date(dataHora)
      return data.toLocaleString("pt-BR")
    } catch (error) {
      return dataHora
    }
  }

  const getVelocidadeStatus = (velocidade: number) => {
    if (velocidade > 80) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Alta
        </Badge>
      )
    } else if (velocidade > 60) {
      return <Badge variant="warning">Média</Badge>
    } else {
      return <Badge variant="outline">Normal</Badge>
    }
  }

  const getConfiancaPlacaStatus = (confianca: number) => {
    if (confianca > 90) {
      return <Badge variant="default">Alta</Badge>
    } else if (confianca > 70) {
      return <Badge variant="secondary">Média</Badge>
    } else {
      return <Badge variant="outline">Baixa</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de Veículos</CardTitle>
        <CardDescription>
          Visualize todos os registros de veículos que passaram pela lombada eletrônica.
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por data/hora, velocidade ou placa..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Carregando registros...</p>
          </div>
        ) : filteredRegistros.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p>Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Velocidade</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.dataHora}>
                    <TableCell>{formatarData(registro.dataHora)}</TableCell>
                    <TableCell>{registro.velocidade} km/h</TableCell>
                    <TableCell>
                      {registro.placa ? (
                        <div className="flex items-center gap-2">
                          <span>{registro.placa}</span>
                          {getConfiancaPlacaStatus(registro.confiancaPlaca)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Não detectada</span>
                      )}
                    </TableCell>
                    <TableCell>{getVelocidadeStatus(registro.velocidade)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRegistro(registro)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Registro</DialogTitle>
                          </DialogHeader>
                          {selectedRegistro && (
                            <div className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Informações</h3>
                                  <div className="space-y-2">
                                    <p>
                                      <span className="font-medium">Data e Hora:</span>{" "}
                                      {formatarData(selectedRegistro.dataHora)}
                                    </p>
                                    <p>
                                      <span className="font-medium">Velocidade:</span>{" "}
                                      {selectedRegistro.velocidade} km/h
                                    </p>
                                    <p>
                                      <span className="font-medium">Status:</span>{" "}
                                      {getVelocidadeStatus(selectedRegistro.velocidade)}
                                    </p>
                                    <p>
                                      <span className="font-medium">Placa:</span>{" "}
                                      {selectedRegistro.placa || "Não detectada"}
                                    </p>
                                    {selectedRegistro.placa && (
                                      <>
                                        <p>
                                          <span className="font-medium">Confiança da Detecção:</span>{" "}
                                          {selectedRegistro.confiancaPlaca.toFixed(1)}%{" "}
                                          {getConfiancaPlacaStatus(selectedRegistro.confiancaPlaca)}
                                        </p>
                                        <p>
                                          <span className="font-medium">Tipo de Veículo:</span>{" "}
                                          <div className="flex items-center gap-1">
                                            <Car className="h-4 w-4" />
                                            {selectedRegistro.tipoVeiculo || "Não identificado"}
                                          </div>
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-semibold mb-2">Imagem do Veículo</h3>
                                  {selectedRegistro.imagemUrl ? (
                                    <div className="relative h-48 w-full border rounded-md overflow-hidden">
                                      <Image
                                        src={selectedRegistro.imagemUrl || "/placeholder.svg"}
                                        alt={`Veículo ${formatarData(selectedRegistro.dataHora)}`}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex justify-center items-center h-48 border rounded-md bg-muted">
                                      <p className="text-muted-foreground">Imagem não disponível</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 