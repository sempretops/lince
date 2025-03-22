"use server"

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import type { Registro } from "@/types/registro"

export async function obterRegistros(): Promise<Registro[]> {
  try {
    const caminhoArquivoJson = join(process.cwd(), "data", "registros.json")

    if (!existsSync(caminhoArquivoJson)) {
      return []
    }

    const conteudo = readFileSync(caminhoArquivoJson, "utf-8")
    const registros: Registro[] = JSON.parse(conteudo)

    return registros
  } catch (error) {
    console.error("Erro ao obter registros:", error)
    return []
  }
}

