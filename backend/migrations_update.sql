-- ============================================
-- SQL PARA ATUALIZAR O BANCO DE DADOS
-- Execute este SQL no seu banco PostgreSQL
-- ============================================

-- 1. Adicionar coluna activeEvolutions na tabela ControlPanel (se ainda não existir)
-- Verificar primeiro se a coluna já existe antes de executar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ControlPanel' 
        AND column_name = 'activeEvolutions'
    ) THEN
        ALTER TABLE "ControlPanel" ADD COLUMN "activeEvolutions" TEXT;
        RAISE NOTICE 'Coluna activeEvolutions adicionada à tabela ControlPanel';
    ELSE
        RAISE NOTICE 'Coluna activeEvolutions já existe na tabela ControlPanel';
    END IF;
END $$;

-- 2. Criar tabela MessageQueue (fila de mensagens quando não há operador online)
CREATE TABLE IF NOT EXISTS "MessageQueue" (
    "id" SERIAL NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactName" TEXT,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "segment" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MessageQueue_pkey" PRIMARY KEY ("id")
);

-- 3. Criar índices para a tabela MessageQueue
CREATE INDEX IF NOT EXISTS "MessageQueue_status_idx" ON "MessageQueue"("status");
CREATE INDEX IF NOT EXISTS "MessageQueue_contactPhone_idx" ON "MessageQueue"("contactPhone");
CREATE INDEX IF NOT EXISTS "MessageQueue_segment_idx" ON "MessageQueue"("segment");
CREATE INDEX IF NOT EXISTS "MessageQueue_createdAt_idx" ON "MessageQueue"("createdAt");

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se tudo foi criado corretamente:

-- Verificar se a coluna activeEvolutions existe
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'ControlPanel' AND column_name = 'activeEvolutions';

-- Verificar se a tabela MessageQueue foi criada
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'MessageQueue';

-- Verificar índices da MessageQueue
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'MessageQueue';

