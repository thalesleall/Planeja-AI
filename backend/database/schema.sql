-- Planeja-AI Database Schema
-- Execute este script no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL,
  password character varying NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.to_do_plan (
  id bigint NOT NULL DEFAULT nextval('to_do_plan_id_seq'::regclass),
  name character varying NOT NULL,
  owner_id bigint NOT NULL,
  CONSTRAINT to_do_plan_pkey PRIMARY KEY (id),
  CONSTRAINT fk_users_to_to_do_plan FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela de listas
CREATE TABLE IF NOT EXISTS public.to_do_list (
  id bigint NOT NULL DEFAULT nextval('to_do_list_id_seq'::regclass),
  owner_id bigint NOT NULL,
  CONSTRAINT to_do_list_pkey PRIMARY KEY (id),
  CONSTRAINT fk_users_to_to_do_list FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela de itens da lista (tarefas)
CREATE TABLE IF NOT EXISTS public.to_do_item (
  id bigint NOT NULL DEFAULT nextval('to_do_item_id_seq'::regclass),
  list_id bigint NOT NULL,
  item_order integer NOT NULL,
  name character varying NOT NULL,
  description character varying,
  done boolean NOT NULL DEFAULT false,
  CONSTRAINT to_do_item_pkey PRIMARY KEY (id),
  CONSTRAINT fk_to_do_list_to_to_do_item FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE
);

-- Tabela de steps (relaciona planos com listas)
CREATE TABLE IF NOT EXISTS public.steps (
  id bigint NOT NULL DEFAULT nextval('steps_id_seq'::regclass),
  plan_id bigint NOT NULL,
  step_order integer NOT NULL,
  list_id bigint NOT NULL,
  CONSTRAINT steps_pkey PRIMARY KEY (id),
  CONSTRAINT fk_to_do_plan_to_steps FOREIGN KEY (plan_id) REFERENCES public.to_do_plan(id) ON DELETE CASCADE,
  CONSTRAINT fk_to_do_list_to_steps FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE
);

-- Criar sequences se não existirem
CREATE SEQUENCE IF NOT EXISTS users_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_plan_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_list_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_item_id_seq;
CREATE SEQUENCE IF NOT EXISTS steps_id_seq;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_to_do_plan_owner_id ON public.to_do_plan(owner_id);
CREATE INDEX IF NOT EXISTS idx_to_do_list_owner_id ON public.to_do_list(owner_id);
CREATE INDEX IF NOT EXISTS idx_to_do_item_list_id ON public.to_do_item(list_id);
CREATE INDEX IF NOT EXISTS idx_to_do_item_done ON public.to_do_item(done);
CREATE INDEX IF NOT EXISTS idx_steps_plan_id ON public.steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_steps_list_id ON public.steps(list_id);
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT to_do_item_pkey PRIMARY KEY (id),
  CONSTRAINT fk_to_do_list_to_to_do_item FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE
);

-- Tabela de steps (relaciona planos com listas)
CREATE TABLE IF NOT EXISTS public.steps (
  id bigint NOT NULL DEFAULT nextval('steps_id_seq'::regclass),
  plan_id bigint NOT NULL,
  step_order integer NOT NULL DEFAULT 0,
  list_id bigint NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT steps_pkey PRIMARY KEY (id),
  CONSTRAINT fk_to_do_plan_to_steps FOREIGN KEY (plan_id) REFERENCES public.to_do_plan(id) ON DELETE CASCADE,
  CONSTRAINT fk_to_do_list_to_steps FOREIGN KEY (list_id) REFERENCES public.to_do_list(id) ON DELETE CASCADE,
  CONSTRAINT unique_plan_step_order UNIQUE (plan_id, step_order)
);

-- Criar sequences se não existirem
CREATE SEQUENCE IF NOT EXISTS users_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_plan_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_list_id_seq;
CREATE SEQUENCE IF NOT EXISTS to_do_item_id_seq;
CREATE SEQUENCE IF NOT EXISTS steps_id_seq;

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
$$ language 'plpgsql';

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