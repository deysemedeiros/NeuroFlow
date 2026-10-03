-- ============================================================
-- NeuroFlow — Criação completa do banco (schema + RLS + seed)
-- Execute no SQL Editor do Supabase Dashboard.
-- ATENÇÃO: apaga TODOS os dados das tabelas do app e recria do zero.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. Limpeza (permite rodar o script várias vezes)
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DELETE FROM auth.users
WHERE email IN (
  'lucas@neuroflow.app',
  'ana@neuroflow.app',
  'rafael@neuroflow.app',
  'marina@neuroflow.app',
  'paulo@neuroflow.app'
);

DROP TABLE IF EXISTS public.diario_emocoes    CASCADE;
DROP TABLE IF EXISTS public.plano_terapeutico CASCADE;
DROP TABLE IF EXISTS public.paciente          CASCADE;
DROP TABLE IF EXISTS public.clinico           CASCADE;
DROP TABLE IF EXISTS public.responsavel       CASCADE;
DROP TABLE IF EXISTS public.usuarios          CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user()       CASCADE;
DROP FUNCTION IF EXISTS public.protect_usuario_fields() CASCADE;
DROP FUNCTION IF EXISTS public.default_user_status()   CASCADE;
DROP FUNCTION IF EXISTS public.is_responsavel_de(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_clinico_de(UUID)     CASCADE;

DROP TYPE IF EXISTS public.status_usuario CASCADE;
DROP TYPE IF EXISTS public.status_plano   CASCADE;
DROP TYPE IF EXISTS public.tipo_usuario   CASCADE;


-- ─────────────────────────────────────────────────────────────
-- 1. Tipos
-- ─────────────────────────────────────────────────────────────
CREATE TYPE public.tipo_usuario   AS ENUM ('Paciente', 'Responsavel', 'Clinico');
CREATE TYPE public.status_plano   AS ENUM ('Ativo', 'Concluído', 'Suspenso');
CREATE TYPE public.status_usuario AS ENUM ('pendente', 'ativo', 'rejeitado');


-- ─────────────────────────────────────────────────────────────
-- 2. Tabelas
-- ─────────────────────────────────────────────────────────────

-- Perfil público vinculado ao auth.users
CREATE TABLE public.usuarios (
  id              UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            VARCHAR(100)  NOT NULL,
  email           TEXT          NOT NULL,
  data_nascimento DATE,
  tipo_usuario    public.tipo_usuario   NOT NULL DEFAULT 'Paciente',
  foto_url        TEXT,
  status          public.status_usuario NOT NULL DEFAULT 'pendente',
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE public.responsavel (
  id UUID PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE TABLE public.paciente (
  id             UUID    PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  id_responsavel UUID    REFERENCES public.responsavel(id) ON DELETE SET NULL,
  diagnostico    TEXT,
  pontuacao_game INTEGER DEFAULT 0
);

CREATE TABLE public.clinico (
  id                    UUID         PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  registro_profissional VARCHAR(50),
  especialidade         VARCHAR(100)
);

CREATE TABLE public.diario_emocoes (
  id            BIGSERIAL    PRIMARY KEY,
  id_paciente   UUID         NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  data_registro TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  sentimento    VARCHAR(50),
  descricao     TEXT
);

CREATE TABLE public.plano_terapeutico (
  id          BIGSERIAL PRIMARY KEY,
  id_clinico  UUID NOT NULL REFERENCES public.clinico(id)  ON DELETE CASCADE,
  id_paciente UUID NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  objetivos   TEXT,
  data_inicio DATE,
  status      public.status_plano
);

CREATE INDEX idx_diario_paciente_data ON public.diario_emocoes (id_paciente, data_registro DESC);
CREATE INDEX idx_plano_paciente       ON public.plano_terapeutico (id_paciente);
CREATE INDEX idx_plano_clinico        ON public.plano_terapeutico (id_clinico);
CREATE INDEX idx_paciente_responsavel ON public.paciente (id_responsavel);


-- ─────────────────────────────────────────────────────────────
-- 3. Cadastro automático do perfil
--    Quando alguém se cadastra pelo app (supabase.auth.signUp), os dados
--    do formulário vão em `options.data` e este gatilho cria as linhas em
--    usuarios + paciente/responsavel/clinico. Funciona mesmo com a
--    confirmação de e-mail ligada (o app não precisa estar logado).
-- ─────────────────────────────────────────────────────────────

-- Status inicial de quem se cadastra:
--   'ativo'    → entra direto (bom para portfólio / demonstração)
--   'pendente' → precisa de aprovação manual (Table Editor → usuarios → status)
CREATE FUNCTION public.default_user_status()
RETURNS public.status_usuario
LANGUAGE sql IMMUTABLE
AS $$ SELECT 'ativo'::public.status_usuario $$;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta  JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  tipo  public.tipo_usuario;
  nasc  DATE;
BEGIN
  tipo := CASE meta->>'tipo_usuario'
            WHEN 'Responsavel' THEN 'Responsavel'::public.tipo_usuario
            WHEN 'Clinico'     THEN 'Clinico'::public.tipo_usuario
            ELSE 'Paciente'::public.tipo_usuario
          END;

  IF (meta->>'data_nascimento') ~ '^\d{4}-\d{2}-\d{2}$' THEN
    nasc := (meta->>'data_nascimento')::DATE;
  END IF;

  INSERT INTO public.usuarios (id, nome, email, data_nascimento, tipo_usuario, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(meta->>'nome'), ''), SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    nasc,
    tipo,
    public.default_user_status()
  );

  IF tipo = 'Paciente' THEN
    INSERT INTO public.paciente (id, diagnostico)
    VALUES (NEW.id, NULLIF(TRIM(meta->>'diagnostico'), ''));
  ELSIF tipo = 'Responsavel' THEN
    INSERT INTO public.responsavel (id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.clinico (id, registro_profissional, especialidade)
    VALUES (
      NEW.id,
      NULLIF(TRIM(meta->>'registro_profissional'), ''),
      NULLIF(TRIM(meta->>'especialidade'), '')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 4. Proteção de campos sensíveis
--    O próprio usuário pode editar seu perfil, mas NÃO pode se aprovar
--    (status), trocar de tipo ou mudar o e-mail por aqui. Quem tem acesso
--    ao Dashboard / service_role continua podendo.
-- ─────────────────────────────────────────────────────────────
CREATE FUNCTION public.protect_usuario_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(auth.jwt()->>'role', '') = 'authenticated' THEN
    NEW.status       := OLD.status;
    NEW.tipo_usuario := OLD.tipo_usuario;
    NEW.email        := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_protect_fields
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.protect_usuario_fields();


-- ─────────────────────────────────────────────────────────────
-- 5. Funções auxiliares de permissão
--    SECURITY DEFINER evita "infinite recursion" entre políticas que
--    consultam umas às outras (paciente ↔ plano_terapeutico).
-- ─────────────────────────────────────────────────────────────
CREATE FUNCTION public.is_responsavel_de(p_paciente UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.paciente
    WHERE id = p_paciente AND id_responsavel = auth.uid()
  )
$$;

CREATE FUNCTION public.is_clinico_de(p_paciente UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plano_terapeutico
    WHERE id_paciente = p_paciente AND id_clinico = auth.uid()
  )
$$;


-- ─────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsavel       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paciente          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinico           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_emocoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_terapeutico ENABLE ROW LEVEL SECURITY;

-- usuarios ----------------------------------------------------
-- Inserção só pelo gatilho handle_new_user (sem política de INSERT).
CREATE POLICY "usuarios_select"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR tipo_usuario = 'Clinico'              -- lista de profissionais
    OR public.is_responsavel_de(id)          -- responsável vê seus pacientes
    OR public.is_clinico_de(id)              -- clínico vê seus pacientes
  );

CREATE POLICY "usuarios_update_own"
  ON public.usuarios FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- responsavel -------------------------------------------------
CREATE POLICY "responsavel_select_own"
  ON public.responsavel FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- paciente ----------------------------------------------------
CREATE POLICY "paciente_select"
  ON public.paciente FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id_responsavel = auth.uid()
    OR public.is_clinico_de(id)
  );

CREATE POLICY "paciente_update_own"
  ON public.paciente FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- clinico -----------------------------------------------------
CREATE POLICY "clinico_select_all"
  ON public.clinico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clinico_update_own"
  ON public.clinico FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- diario_emocoes ----------------------------------------------
-- Paciente: lê, cria, edita e apaga os próprios registros.
CREATE POLICY "diario_paciente_all"
  ON public.diario_emocoes FOR ALL
  TO authenticated
  USING (id_paciente = auth.uid())
  WITH CHECK (id_paciente = auth.uid());

-- Clínico vinculado e responsável: somente leitura.
CREATE POLICY "diario_acompanhamento_select"
  ON public.diario_emocoes FOR SELECT
  TO authenticated
  USING (
    public.is_clinico_de(id_paciente)
    OR public.is_responsavel_de(id_paciente)
  );

-- plano_terapeutico -------------------------------------------
CREATE POLICY "plano_select"
  ON public.plano_terapeutico FOR SELECT
  TO authenticated
  USING (
    id_paciente = auth.uid()
    OR id_clinico = auth.uid()
    OR public.is_responsavel_de(id_paciente)
  );

CREATE POLICY "plano_clinico_insert"
  ON public.plano_terapeutico FOR INSERT
  TO authenticated
  WITH CHECK (id_clinico = auth.uid());

CREATE POLICY "plano_clinico_update"
  ON public.plano_terapeutico FOR UPDATE
  TO authenticated
  USING (id_clinico = auth.uid())
  WITH CHECK (id_clinico = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- 7. Seed — contas de demonstração (senha de todas: Senha@123)
--    lucas@neuroflow.app  → Paciente
--    ana@neuroflow.app    → Responsável (mãe do Lucas)
--    rafael@neuroflow.app → Clínico (neuropsicólogo do Lucas)
--    marina@neuroflow.app → Clínica (psiquiatra)
--    paulo@neuroflow.app  → Clínico (psicólogo infantil)
--    O gatilho handle_new_user cria os perfis a partir dos metadados.
-- ─────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated',
  v.email, crypt('Senha@123', gen_salt('bf')),
  NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', v.meta,
  NOW(), NOW(), '', '', '', ''
FROM (VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'lucas@neuroflow.app',
   '{"nome":"Lucas Mendes","tipo_usuario":"Paciente","data_nascimento":"2005-03-12","diagnostico":"TDAH Combinado"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'ana@neuroflow.app',
   '{"nome":"Ana Souza","tipo_usuario":"Responsavel","data_nascimento":"1982-07-24"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'rafael@neuroflow.app',
   '{"nome":"Dr. Rafael Costa","tipo_usuario":"Clinico","data_nascimento":"1978-11-05","registro_profissional":"CRP 06/183452","especialidade":"Neuropsicologia"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000004'::uuid, 'marina@neuroflow.app',
   '{"nome":"Dra. Marina Lopes","tipo_usuario":"Clinico","data_nascimento":"1985-02-17","registro_profissional":"CRM-SP 154210","especialidade":"Psiquiatra — Adulto"}'::jsonb),
  ('aaaaaaaa-0000-0000-0000-000000000005'::uuid, 'paulo@neuroflow.app',
   '{"nome":"Dr. Paulo Nogueira","tipo_usuario":"Clinico","data_nascimento":"1990-09-30","registro_profissional":"CRP 06/201877","especialidade":"Psicólogo — Infantil"}'::jsonb)
) AS v(id, email, meta);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
SELECT u.id, u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.email LIKE '%@neuroflow.app';

-- Fotos e vínculos (o gatilho cria o básico; aqui completamos a demo)
UPDATE public.usuarios SET foto_url = 'https://i.pravatar.cc/150?img=12' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE public.usuarios SET foto_url = 'https://i.pravatar.cc/150?img=47' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
UPDATE public.usuarios SET foto_url = 'https://i.pravatar.cc/150?img=68' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003';
UPDATE public.usuarios SET foto_url = 'https://i.pravatar.cc/150?img=45' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004';
UPDATE public.usuarios SET foto_url = 'https://i.pravatar.cc/150?img=59' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005';
UPDATE public.usuarios SET status = 'ativo' WHERE email LIKE '%@neuroflow.app';

UPDATE public.paciente
SET id_responsavel = 'aaaaaaaa-0000-0000-0000-000000000002',
    pontuacao_game = 340
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';

INSERT INTO public.plano_terapeutico (id_clinico, id_paciente, objetivos, data_inicio, status) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Melhorar foco e concentração, reduzir impulsividade e desenvolver rotina estruturada com auxílio de ferramentas digitais.',
   CURRENT_DATE - 60, 'Ativo'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Higiene do sono: horário fixo para dormir e redução de telas à noite.',
   CURRENT_DATE - 180, 'Concluído');

INSERT INTO public.diario_emocoes (id_paciente, sentimento, descricao, data_registro) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Motivado',  'Comecei a semana organizando as tarefas no app.',                         NOW() - INTERVAL '6 hours'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Feliz',     'Consegui me concentrar por 45 minutos seguidos hoje. Muito orgulhoso!',  NOW() - INTERVAL '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ansioso',   'Prova amanhã. Usei a respiração guiada antes de dormir.',               NOW() - INTERVAL '2 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Cansado',   'Muita lição de casa, me senti sobrecarregado à noite.',                 NOW() - INTERVAL '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Calmo',     'Dia tranquilo, caminhei pela manhã.',                                    NOW() - INTERVAL '4 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Frustrado', 'Perdi o foco várias vezes durante a aula.',                              NOW() - INTERVAL '5 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Motivado',  'Usei o temporizador e terminei todas as tarefas.',                       NOW() - INTERVAL '6 days');
