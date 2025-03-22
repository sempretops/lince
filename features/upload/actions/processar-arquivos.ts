'use server'

import { supabase } from "@/lib/supabase"
import { detectPlate } from "../services/plate-detection"
import fs from "fs"
import path from "path"

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

      const [dataHora, velocidade, id] = linha.split("\t")
      if (!dataHora || !velocidade || !id) continue

      // Encontrar a imagem correspondente
      const dataHoraFormatada = dataHora.replace(/[^0-9]/g, "")
      const imagemCorrespondente = imageFiles.find((file) => {
        const nomeArquivo = file.name.replace(/[^0-9]/g, "")
        return nomeArquivo.includes(dataHoraFormatada)
      })

      // Upload da imagem para o Supabase Storage e detecção da placa
      let imagemUrl = null
      let plateInfo = { plate: null, confidence: 0, vehicleType: null }

      if (imagemCorrespondente) {
        // Detectar placa antes do upload
        plateInfo = await detectPlate(imagemCorrespondente)

        // Upload da imagem
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("imagens-veiculos")
          .upload(`${id}/${imagemCorrespondente.name}`, imagemCorrespondente)

        if (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError)
        } else {
          const { data: urlData } = supabase.storage.from("imagens-veiculos").getPublicUrl(uploadData.path)
          imagemUrl = urlData.publicUrl
        }
      }

      // Inserir registro no banco de dados
      const { error: insertError } = await supabase.from("registros").insert({
        id: parseInt(id),
        dataHora,
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