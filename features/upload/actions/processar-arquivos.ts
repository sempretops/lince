'use server'

import { supabase } from "@/lib/supabase"
import { detectPlate } from "../services/plate-detection"

function parseDataHora(dataHora: string): Date | null {
  try {
    // Assumindo formato "YYYY-MM-DD HH:mm:ss"
    return new Date(dataHora)
  } catch (error) {
    console.error("Erro ao converter data/hora:", error)
    return null
  }
}

function formatDataHoraForMatch(date: Date): string {
  return date.toISOString().replace(/[^0-9]/g, "").slice(0, 14) // YYYYMMDDHHmmss
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB em bytes

export async function processarArquivos(formData: FormData) {
  try {
    const csvFile = formData.get("csv") as File
    const imageFiles = formData.getAll("images") as File[]

    if (!csvFile) {
      return { success: false, error: "Arquivo CSV não fornecido" }
    }

    // Verificar tamanho dos arquivos
    for (const file of [csvFile, ...imageFiles]) {
      if (file.size > MAX_FILE_SIZE) {
        return { 
          success: false, 
          error: `Arquivo ${file.name} excede o tamanho máximo permitido de 10MB` 
        }
      }
    }

    // Processar o arquivo CSV
    const csvContent = await csvFile.text()
    const linhas = csvContent.split("\n")

    let registrosProcessados = 0
    let erros = []

    for (const linha of linhas) {
      if (!linha.trim()) continue

      try {
        // Agora esperamos apenas data/hora e velocidade no CSV
        const [dataHora, velocidade] = linha.split("\t")
        if (!dataHora || !velocidade) {
          erros.push(`Linha inválida: ${linha}`)
          continue
        }

        const dataParsed = parseDataHora(dataHora)
        if (!dataParsed) {
          erros.push(`Data/hora inválida: ${dataHora}`)
          continue
        }

        const dataFormatada = formatDataHoraForMatch(dataParsed)

        // Encontrar a imagem correspondente
        const imagemCorrespondente = imageFiles.find((file) => {
          // Remove extensão e caracteres especiais do nome do arquivo
          const nomeArquivo = file.name.split(".")[0].replace(/[^0-9]/g, "")
          // Compara os timestamps (considerando segundos)
          return nomeArquivo === dataFormatada
        })

        // Upload da imagem para o Supabase Storage
        let imagemUrl = null
        let plateInfo = { plate: null as string | null, confidence: 0, vehicleType: null as string | null }

        if (imagemCorrespondente) {
          try {
            // Detectar placa antes do upload
            plateInfo = await detectPlate(imagemCorrespondente)
          } catch (error) {
            console.error("Erro ao detectar placa:", error)
            erros.push(`Erro ao detectar placa na imagem ${imagemCorrespondente.name}: ${error.message}`)
          }

          try {
            // Upload da imagem
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("imagens-veiculos")
              .upload(`${dataFormatada}/${imagemCorrespondente.name}`, imagemCorrespondente)

            if (uploadError) {
              console.error("Erro ao fazer upload da imagem:", uploadError)
              erros.push(`Erro ao fazer upload da imagem ${imagemCorrespondente.name}: ${uploadError.message}`)
            } else {
              const { data: urlData } = supabase.storage.from("imagens-veiculos").getPublicUrl(uploadData.path)
              imagemUrl = urlData.publicUrl
            }
          } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error)
            erros.push(`Erro ao fazer upload da imagem ${imagemCorrespondente.name}: ${error.message}`)
          }
        }

        // Inserir registro no banco de dados
        const { error: insertError } = await supabase.from("registros").insert({
          dataHora: dataParsed.toISOString(),
          velocidade: parseInt(velocidade),
          imagemUrl,
          placa: plateInfo.plate,
          confiancaPlaca: plateInfo.confidence,
          tipoVeiculo: plateInfo.vehicleType,
        })

        if (insertError) {
          console.error("Erro ao inserir registro:", insertError)
          erros.push(`Erro ao inserir registro para data ${dataHora}: ${insertError.message}`)
          continue
        }

        registrosProcessados++
      } catch (error) {
        console.error("Erro ao processar linha:", error)
        erros.push(`Erro ao processar linha: ${error.message}`)
      }
    }

    return { 
      success: true, 
      registrosProcessados,
      erros: erros.length > 0 ? erros : undefined
    }
  } catch (error) {
    console.error("Erro ao processar arquivos:", error)
    return { 
      success: false, 
      error: `Erro ao processar arquivos: ${error.message}` 
    }
  }
} 