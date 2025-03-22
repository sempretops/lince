import { createWorker } from 'tesseract.js';
import { ObjectDetector } from '@cloud-annotations/object-detection';

export interface PlateDetectionResult {
  plate: string | null;
  confidence: number;
  vehicleType: string | null;
}

export async function detectPlate(imageFile: File): Promise<PlateDetectionResult> {
  try {
    // Carregar o modelo de detecção de veículos
    const detector = await ObjectDetector.load('/models/vehicle-detection');
    
    // Converter o arquivo em uma imagem
    const img = new Image();
    const imageUrl = URL.createObjectURL(imageFile);
    img.src = imageUrl;
    await new Promise((resolve) => (img.onload = resolve));

    // Detectar veículos na imagem
    const predictions = await detector.detect(img);
    
    // Encontrar o veículo com maior confiança
    const vehicle = predictions.sort((a, b) => b.score - a.score)[0];
    
    if (!vehicle || vehicle.score < 0.5) {
      return { plate: null, confidence: 0, vehicleType: null };
    }

    // Recortar a região da placa (assumindo que está na parte inferior do veículo)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar o contexto 2D');

    const plateRegion = {
      x: vehicle.bbox[0],
      y: vehicle.bbox[1] + (vehicle.bbox[3] * 0.7), // 70% da altura do veículo
      width: vehicle.bbox[2],
      height: vehicle.bbox[3] * 0.3, // 30% da altura do veículo
    };

    canvas.width = plateRegion.width;
    canvas.height = plateRegion.height;
    
    ctx.drawImage(
      img,
      plateRegion.x,
      plateRegion.y,
      plateRegion.width,
      plateRegion.height,
      0,
      0,
      plateRegion.width,
      plateRegion.height
    );

    // Configurar o Tesseract para reconhecimento de texto
    const worker = await createWorker('por');
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    // Reconhecer o texto da placa
    const { data: { text, confidence } } = await worker.recognize(canvas);
    await worker.terminate();

    // Limpar URL do objeto
    URL.revokeObjectURL(imageUrl);

    // Formatar e validar a placa
    const plate = formatPlate(text);
    
    return {
      plate: plate,
      confidence: confidence,
      vehicleType: vehicle.class,
    };
  } catch (error) {
    console.error('Erro ao detectar placa:', error);
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