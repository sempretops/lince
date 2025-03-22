'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('_tables').select('*').limit(1)
        
        if (error) {
          setStatus('error')
          setMessage('Erro na conexão: ' + error.message)
        } else {
          setStatus('success')
          setMessage('Conexão com Supabase estabelecida com sucesso!')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Erro ao conectar: ' + (err as Error).message)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
      <div className={`p-4 rounded-lg ${
        status === 'loading' ? 'bg-yellow-100' :
        status === 'success' ? 'bg-green-100' :
        'bg-red-100'
      }`}>
        <p className={`font-medium ${
          status === 'loading' ? 'text-yellow-800' :
          status === 'success' ? 'text-green-800' :
          'text-red-800'
        }`}>
          {status === 'loading' ? 'Testando conexão...' : message}
        </p>
      </div>
    </div>
  )
} 