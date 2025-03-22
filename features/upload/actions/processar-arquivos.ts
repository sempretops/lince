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

export async function processarArquivos(formData: FormData) {
  try {
    const csvFile = formData.get("csv") as File
    const imageFiles = formData.getAll("images") as File[]

    // Processar o arquivo CSV
    const csvContent = await csvFile.text()
    const linhas = csvContent.split("\n")

    let registrosProcessados = 0

    for (const linha of linhas) {
      if (!linha.trim()) continue

      // Agora esperamos apenas data/hora e velocidade no CSV
      const [dataHora, velocidade] = linha.split("\t")
      if (!dataHora || !velocidade) continue

      const dataParsed = parseDataHora(dataHora)
      if (!dataParsed) {
        console.error("Data/hora inválida:", dataHora)
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
        // Detectar placa antes do upload
        try {
          plateInfo = await detectPlate(imagemCorrespondente)
        } catch (error) {
          console.error("Erro ao detectar placa:", error)
        }

        // Upload da imagem
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("imagens-veiculos")
          .upload(`${dataFormatada}/${imagemCorrespondente.name}`, imagemCorrespondente)

        if (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError)
        } else {
          const { data: urlData } = supabase.storage.from("imagens-veiculos").getPublicUrl(uploadData.path)
          imagemUrl = urlData.publicUrl
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
        continue
      }

      registrosProcessados++
    }

    return { success: true, registrosProcessados }
  } catch (error) {
    console.error("Erro ao processar arquivos:", error)
    return { success: false, error: "Erro ao processar arquivos" }
  }
} 