export type Registro = {
  id?: number // ID automático gerado pelo Supabase
  dataHora: string
  velocidade: number
  imagemUrl: string | null
  placa: string | null
  confiancaPlaca: number
  tipoVeiculo: string | null
}

