"use server"

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { Registro } from "@/types/registro"

export async function processarArquivos(formData: FormData) {
  try {
    // Obter o arquivo CSV
    const csvFile = formData.get("csv") as File
    if (!csvFile) {
      return { success: false, error: "Arquivo CSV não encontrado" }
    }

    // Ler o conteúdo do arquivo CSV
    const csvBuffer = Buffer.from(await csvFile.arrayBuffer())
    const csvContent = csvBuffer.toString("utf-8")

    // Processar o conteúdo do CSV
    const linhas = csvContent.split("\n").filter((linha) => linha.trim() !== "")
    const registros: Registro[] = []

    for (const linha of linhas) {
      const [dataHora, velocidade, id] = linha.split("\t")

      if (dataHora && velocidade && id) {
        registros.push({
          id: Number.parseInt(id.trim()),
          dataHora: dataHora.trim(),
          velocidade: Number.parseInt(velocidade.trim()),
          imagemUrl: null,
        })
      }
    }

    // Obter as imagens
    const imagens = formData.getAll("images") as File[]

    // Criar diretório para armazenar as imagens se não existir
    const diretorioPublico = join(process.cwd(), "public")
    const diretorioImagens = join(diretorioPublico, "uploads")

    if (!existsSync(diretorioPublico)) {
      mkdirSync(diretorioPublico)
    }

    if (!existsSync(diretorioImagens)) {
      mkdirSync(diretorioImagens)
    }

    // Processar cada imagem e associar ao registro correspondente
    for (const imagem of imagens) {
      const nomeArquivo = imagem.name

      // Extrair data e hora do nome do arquivo
      // Formato esperado: YYYY-MM-DD HH MM SS.jpg
      const match = nomeArquivo.match(/(\d{4}-\d{2}-\d{2}) (\d{2}) (\d{2}) (\d{2})\.jpg/)

      if (match) {
        const [, data, hora, minuto, segundo] = match
        const dataHoraImagem = `${data} ${hora}:${minuto}:${segundo}`

        // Encontrar o registro correspondente
        const registro = registros.find((r) => {
          const dataHoraRegistro = r.dataHora
          return dataHoraRegistro.includes(`${hora}:${minuto}:${segundo}`)
        })

        if (registro) {
          // Salvar a imagem
          const caminhoImagem = join(diretorioImagens, `${registro.id}_${nomeArquivo}`)
          const imagemBuffer = Buffer.from(await imagem.arrayBuffer())
          writeFileSync(caminhoImagem, imagemBuffer)

          // Atualizar o registro com o caminho da imagem
          registro.imagemUrl = `/uploads/${registro.id}_${nomeArquivo}`
        }
      }
    }

    // Salvar os registros em um arquivo JSON
    const diretorioDados = join(process.cwd(), "data")
    if (!existsSync(diretorioDados)) {
      mkdirSync(diretorioDados)
    }

    const caminhoArquivoJson = join(diretorioDados, "registros.json")

    // Verificar se já existem registros
    let registrosExistentes: Registro[] = []
    if (existsSync(caminhoArquivoJson)) {
      const conteudoExistente = readFileSync(caminhoArquivoJson, "utf-8")
      registrosExistentes = JSON.parse(conteudoExistente)
    }

    // Combinar registros existentes com novos registros
    const todosRegistros = [...registrosExistentes, ...registros]

    // Remover duplicatas baseado no ID
    const registrosUnicos = todosRegistros.reduce((acc, current) => {
      const x = acc.find((item) => item.id === current.id)
      if (!x) {
        return acc.concat([current])
      } else {
        // Se o registro já existe, mas não tem imagem e o atual tem, atualiza
        if (!x.imagemUrl && current.imagemUrl) {
          x.imagemUrl = current.imagemUrl
        }
        return acc
      }
    }, [] as Registro[])

    // Salvar no arquivo JSON
    writeFileSync(caminhoArquivoJson, JSON.stringify(registrosUnicos, null, 2))

    return {
      success: true,
      registrosProcessados: registros.length,
      registrosComImagem: registros.filter((r) => r.imagemUrl !== null).length,
    }
  } catch (error) {
    console.error("Erro ao processar arquivos:", error)
    return {
      success: false,
      error: "Ocorreu um erro ao processar os arquivos.",
    }
  }
}

