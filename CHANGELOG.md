# Changelog

## 1.1.0 — Versão portfólio

Reorganização do projeto original (feito no Replit) para rodar e ser hospedado fora dele.

### Estrutura
- Projeto independente com `npm` (antes: monorepo pnpm do Replit com pacotes não usados).
- Removidos: servidor Express antigo, pacotes `api-spec`/`api-zod`/`db` (Drizzle) e `mockup-sandbox`, que ficaram sem uso após a migração para o Supabase; prompts e arquivos internos do Replit; tela `app/perfil.tsx` duplicada; React Query (não usado).
- Configuração de hospedagem web para **Vercel** (`vercel.json`) e **Netlify** (`netlify.toml`).
- `.env.example` documentando as variáveis.

### Correções
- **Cadastro com confirmação de e-mail:** o perfil não era criado quando o Supabase exigia confirmação (a inserção rodava sem usuário logado e era bloqueada pelo RLS). Agora o perfil é criado pelo gatilho `handle_new_user` no banco.
- **Login de conta pendente/rejeitada:** o app navegava para a tela inicial sem perfil carregado. Agora mostra a mensagem correta e encerra a sessão.
- **Responsável não via o nome dos pacientes vinculados** (o RLS de `usuarios` bloqueava). Corrigido.
- **Autoaprovação:** qualquer usuário conseguia mudar o próprio `status` para `ativo`. Agora `status`, `tipo_usuario` e `email` são protegidos por gatilho.
- Clínico podia apagar/editar o diário do paciente; agora é somente leitura.
- Políticas reescritas com funções `SECURITY DEFINER` para evitar recursão entre `paciente` e `plano_terapeutico`.
- Agendamento mostrava datas fixas (22 a 28); agora mostra os próximos 7 dias.
- Tela de erro traduzida para português.

### Novidades
- Botões **“Testar sem cadastro”** no login (contas demo), ativados por `EXPO_PUBLIC_DEMO_MODE`.
- **Esqueceu a senha?** agora envia o e-mail de redefinição.
- Humor escolhido na tela Início é salvo no diário.
- Progresso das metas salvo por usuário e por semana.
- Splash leva direto ao app quando já existe sessão.
- Seed com 5 contas, 2 planos e 7 registros de diário; script `reset-demo.sql` para restaurar a demo.
- Índices no banco para as consultas mais usadas.

## 1.0.0 — Entrega do TCC
Versão original desenvolvida pela equipe no Replit.
