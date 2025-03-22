# Sistema de Lombada Eletrônica

Sistema para gerenciamento de lombadas eletrônicas com detecção de placas e monitoramento de velocidade.

## Tecnologias Utilizadas

- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- Tesseract.js (OCR)

## Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta no Vercel (para deploy)

## Configuração Local

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env.local` e preencha com suas credenciais do Supabase
4. Execute o projeto em desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy no Vercel

1. Faça push do código para um repositório Git (GitHub, GitLab ou Bitbucket)
2. Acesse [Vercel](https://vercel.com) e faça login
3. Clique em "New Project"
4. Importe seu repositório
5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Clique em "Deploy"

## Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Crie uma tabela `registros` com os seguintes campos:
   - `id` (int, primary key, auto-increment)
   - `dataHora` (timestamp)
   - `velocidade` (int)
   - `imagemUrl` (text, nullable)
   - `placa` (text, nullable)
   - `confiancaPlaca` (float)
   - `tipoVeiculo` (text, nullable)
3. Crie um bucket `imagens-veiculos` no Storage
4. Configure as políticas de segurança do Storage para permitir upload de imagens

## Estrutura do Projeto

```
features/
  ├── dashboard/     # Componentes e lógica do dashboard
  ├── upload/        # Componentes e lógica de upload
  └── auth/          # Componentes e lógica de autenticação
lib/
  └── supabase.ts    # Configuração do cliente Supabase
types/
  └── registro.ts    # Tipos TypeScript
```

## Licença

MIT 