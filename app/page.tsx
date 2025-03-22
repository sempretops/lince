import { Upload } from "@/components/upload"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Sistema de Gerenciamento de Lombada Eletrônica</h1>
      <div className="grid gap-8">
        <Upload />
        <Dashboard />
      </div>
    </div>
  )
}

