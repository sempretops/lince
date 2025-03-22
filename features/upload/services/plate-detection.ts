import { createWorker } from 'tesseract.js';

export interface PlateDetectionResult {
  plate: string | null;
  confidence: number;
  vehicleType: string | null;
}

export async function detectPlate(imageFile: File): Promise<PlateDetectionResult> {
  try {
    // Converter o arquivo em uma URL de dados
    const imageUrl = URL.createObjectURL(imageFile);

    // Configurar o Tesseract para reconhecimento de texto
    const worker = await createWorker({
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      gzip: false,
      logger: m => console.log(m)
    });

    await worker.loadLanguage('por');
    await worker.initialize('por');

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    // Realizar OCR na imagem
    const { data: { text } } = await worker.recognize(imageUrl);

    // Limpar a URL do objeto
    URL.revokeObjectURL(imageUrl);

    // Processar o texto reconhecido para encontrar a placa
    const placaMatch = text.match(/[A-Z]{3}[0-9][0-9A-Z][0-9]{2}/);
    if (!placaMatch) {
      return { plate: null, confidence: 0, vehicleType: null };
    }

    const placa = placaMatch[0];
    const confidence = 0.8; // Valor fixo por enquanto, pode ser ajustado baseado na qualidade do OCR

    // Determinar o tipo de veículo baseado em características da imagem
    // Por enquanto, retornamos um valor fixo
    const vehicleType = "Automóvel";

    // Terminar o worker
    await worker.terminate();

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