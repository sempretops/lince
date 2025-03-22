'use server'

import { supabase } from "@/lib/supabase"
import type { Registro } from "@/types/registro"

export async function obterRegistros(): Promise<Registro[]> {
  try {
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .order("dataHora", { ascending: false })

    if (error) {
      console.error("Erro ao obter registros:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao obter registros:", error)
    return []
  }
} 