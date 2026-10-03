-- ============================================================
-- NeuroFlow — Restaura só os dados de demonstração
-- Use quando visitantes do portfólio bagunçarem as contas demo.
-- Não mexe nas contas reais de quem se cadastrou.
-- ============================================================

-- Senhas das contas demo de volta para Senha@123
UPDATE auth.users
SET encrypted_password = crypt('Senha@123', gen_salt('bf')), updated_at = NOW()
WHERE email LIKE '%@neuroflow.app';

-- Diário do paciente demo
DELETE FROM public.diario_emocoes WHERE id_paciente = 'aaaaaaaa-0000-0000-0000-000000000001';

INSERT INTO public.diario_emocoes (id_paciente, sentimento, descricao, data_registro) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Motivado',  'Comecei a semana organizando as tarefas no app.',                         NOW() - INTERVAL '6 hours'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Feliz',     'Consegui me concentrar por 45 minutos seguidos hoje. Muito orgulhoso!',  NOW() - INTERVAL '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ansioso',   'Prova amanhã. Usei a respiração guiada antes de dormir.',               NOW() - INTERVAL '2 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Cansado',   'Muita lição de casa, me senti sobrecarregado à noite.',                 NOW() - INTERVAL '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Calmo',     'Dia tranquilo, caminhei pela manhã.',                                    NOW() - INTERVAL '4 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Frustrado', 'Perdi o foco várias vezes durante a aula.',                              NOW() - INTERVAL '5 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Motivado',  'Usei o temporizador e terminei todas as tarefas.',                       NOW() - INTERVAL '6 days');

-- Nomes/fotos originais
UPDATE public.usuarios SET nome = 'Lucas Mendes',       foto_url = 'https://i.pravatar.cc/150?img=12' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE public.usuarios SET nome = 'Ana Souza',          foto_url = 'https://i.pravatar.cc/150?img=47' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
UPDATE public.usuarios SET nome = 'Dr. Rafael Costa',   foto_url = 'https://i.pravatar.cc/150?img=68' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003';
UPDATE public.usuarios SET nome = 'Dra. Marina Lopes',  foto_url = 'https://i.pravatar.cc/150?img=45' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004';
UPDATE public.usuarios SET nome = 'Dr. Paulo Nogueira', foto_url = 'https://i.pravatar.cc/150?img=59' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005';
