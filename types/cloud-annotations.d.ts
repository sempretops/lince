declare module '@cloud-annotations/object-detection' {
  export interface Detection {
    bbox: [number, number, number, number]
    class: string
    score: number
  }

  export class ObjectDetector {
    static load(modelPath: string): Promise<ObjectDetector>
    detect(image: HTMLImageElement): Promise<Detection[]>
  }
} 