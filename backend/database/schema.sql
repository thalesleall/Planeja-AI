-- Planeja-AI Database Schema
-- Execute este script no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.to_do_plan (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_to_to_do_plan FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela de listas
CREATE TABLE IF NOT EXISTS public.to_do_list (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_to_to_do_list FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela de itens da lista (tarefas)
CREATE TABLE IF NOT EXISTS public.to_do_item (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT NOT NULL,
  item_order INTEGER NOT NULL DEFAULT 0,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  priority VARCHAR(20),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_to_do_list_to_to_do_item FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE
);

-- Tabela de steps (relaciona planos com listas)
CREATE TABLE IF NOT EXISTS public.steps (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  list_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_to_do_plan_to_steps FOREIGN KEY (plan_id) REFERENCES public.to_do_plan(id) ON DELETE CASCADE,
  CONSTRAINT fk_to_do_list_to_steps FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE,
  CONSTRAINT unique_plan_step_order UNIQUE (plan_id, step_order)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_to_do_plan_owner_id ON public.to_do_plan(owner_id);
CREATE INDEX IF NOT EXISTS idx_to_do_list_owner_id ON public.to_do_list(owner_id);
CREATE INDEX IF NOT EXISTS idx_to_do_item_list_id ON public.to_do_item(list_id);
CREATE INDEX IF NOT EXISTS idx_to_do_item_done ON public.to_do_item(done);
CREATE INDEX IF NOT EXISTS idx_to_do_item_priority ON public.to_do_item(priority);
CREATE INDEX IF NOT EXISTS idx_to_do_item_due_date ON public.to_do_item(due_date);
CREATE INDEX IF NOT EXISTS idx_steps_plan_id ON public.steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_steps_list_id ON public.steps(list_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers às tabelas
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_to_do_plan_updated_at ON public.to_do_plan;
CREATE TRIGGER update_to_do_plan_updated_at 
    BEFORE UPDATE ON public.to_do_plan 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_to_do_list_updated_at ON public.to_do_list;
CREATE TRIGGER update_to_do_list_updated_at 
    BEFORE UPDATE ON public.to_do_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_to_do_item_updated_at ON public.to_do_item;
CREATE TRIGGER update_to_do_item_updated_at 
    BEFORE UPDATE ON public.to_do_item 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_steps_updated_at ON public.steps;
CREATE TRIGGER update_steps_updated_at 
    BEFORE UPDATE ON public.steps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();