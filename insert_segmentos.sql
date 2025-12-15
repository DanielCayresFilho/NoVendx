-- Script para inserir segmentos na tabela Segment
-- Usa ON CONFLICT DO NOTHING para evitar duplicatas (campo name é unique)

INSERT INTO "Segment" (name, "createdAt", "updatedAt")
VALUES
    ('BF Call Center', NOW(), NOW()),
    ('BF Consignado', NOW(), NOW()),
    ('Fatura & Correntista', NOW(), NOW()),
    ('Não há segmentos', NOW(), NOW()),
    ('Bv Adm Reneg', NOW(), NOW()),
    ('Bv Adm Tradicional', NOW(), NOW()),
    ('Bv Bom Pagador', NOW(), NOW()),
    ('Bv Cartões Amigável', NOW(), NOW()),
    ('BV CL', NOW(), NOW()),
    ('Bv Contencioso', NOW(), NOW()),
    ('Bv Solar', NOW(), NOW()),
    ('Casas Bahia', NOW(), NOW()),
    ('Dígio Marília', NOW(), NOW()),
    ('Itaú BPF', NOW(), NOW()),
    ('Itaú Ncor', NOW(), NOW()),
    ('NPcred', NOW(), NOW()),
    ('Pan Contacts', NOW(), NOW()),
    ('Safra PJ', NOW(), NOW()),
    ('101_Santander_Over_90', NOW(), NOW()),
    ('101_Santander_Over_PJ', NOW(), NOW()),
    ('101_Santander_Prejuízo', NOW(), NOW()),
    ('101_Santander_Antecipação', NOW(), NOW()),
    ('101_Santander_Cartões', NOW(), NOW()),
    ('101_Santander_Preventivo_PF', NOW(), NOW()),
    ('Digital', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

