import { createWorker } from 'tesseract.js';

export interface PlateDetectionResult {
  plate: string | null;
  confidence: number;
  vehicleType: string | null;
}

export async function detectPlate(imageFile: File): Promise<PlateDetectionResult> {
  try {
    // Por enquanto, vamos apenas extrair a placa do nome do arquivo
    // Isso é um placeholder até implementarmos uma solução mais robusta
    const fileName = imageFile.name.toUpperCase();
    
    // Tentar encontrar uma placa no nome do arquivo
    const placaMatch = fileName.match(/[A-Z]{3}[0-9][0-9A-Z][0-9]{2}/);
    
    if (!placaMatch) {
      return { plate: null, confidence: 0, vehicleType: null };
    }

    const placa = placaMatch[0];
    const confidence = 0.8;
    const vehicleType = "Automóvel";

    return {
      plate: placa,
      confidence,
      vehicleType,
    };
  } catch (error) {
    console.error("Erro ao detectar placa:", error);
    return { plate: null, confidence: 0, vehicleType: null };
  }
}

function formatPlate(text: string): string | null {
  // Remover espaços e caracteres especiais
  const cleaned = text.replace(/[^A-Z0-9]/g, '');
  
  // Validar formato da placa (Mercosul: ABC1D23 ou tradicional: ABC1234)
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const traditionalPattern = /^[A-Z]{3}[0-9]{4}$/;
  
  if (mercosulPattern.test(cleaned) || traditionalPattern.test(cleaned)) {
    return cleaned;
  }
  
  return null;
} 