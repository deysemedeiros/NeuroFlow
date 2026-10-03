<p align="center">
  <img src="assets/images/neuroflow-logo.png" alt="NeuroFlow" width="140" />
</p>

<h1 align="center">NeuroFlow</h1>

<p align="center">
  Plataforma de apoio e acompanhamento para pessoas com <strong>TDAH</strong>,<br/>
  conectando paciente, família e profissional da saúde em um só lugar.
</p>

<p align="center">
  <a href="#-demonstração">Demonstração</a> ·
  <a href="#-funcionalidades">Funcionalidades</a> ·
  <a href="#-tecnologias">Tecnologias</a> ·
  <a href="#-rodando-localmente">Rodar localmente</a> ·
  <a href="docs/DEPLOY.md">Hospedagem</a>
</p>

---

## 📌 Sobre

O NeuroFlow nasceu como Trabalho de Conclusão de Curso do **Técnico em Desenvolvimento de Sistemas (EaD) — Centro Paula Souza, 2026**. A proposta é oferecer uma ferramenta complementar ao acompanhamento clínico de pessoas com TDAH: registro de emoções, metas de rotina, exercícios de respiração e acesso a profissionais, com controle de acesso por perfil e atenção à LGPD.

O app é **multiplataforma** (Android, iOS e Web) a partir de um único código em React Native + Expo, com backend no Supabase (PostgreSQL + Auth + Row Level Security).

> ⚠️ Projeto acadêmico. Não substitui diagnóstico ou tratamento profissional.

## 🚀 Demonstração

- **Versão web:** _adicione aqui o link depois de publicar (ver [docs/DEPLOY.md](docs/DEPLOY.md))_
- Na tela de login, use os botões **“Testar sem cadastro”** ou entre com:

| Perfil       | E-mail                 | Senha       |
|--------------|------------------------|-------------|
| Paciente     | `lucas@neuroflow.app`  | `Senha@123` |
| Responsável  | `ana@neuroflow.app`    | `Senha@123` |
| Clínico      | `rafael@neuroflow.app` | `Senha@123` |

<!-- Dica: coloque prints em docs/screenshots/ e descomente abaixo
<p align="center">
  <img src="docs/screenshots/inicio.png" width="230" />
  <img src="docs/screenshots/diario.png" width="230" />
  <img src="docs/screenshots/profissionais.png" width="230" />
</p>
-->

## ✨ Funcionalidades

| Área | O que faz |
|------|-----------|
| **Autenticação** | Cadastro com 3 perfis (Paciente, Responsável, Clínico), login, recuperação de senha e sessão persistente. Aprovação manual de contas opcional. |
| **Início** | Saudação por horário, registro rápido de humor (salvo no diário), plano terapêutico ativo e resumo da semana. |
| **Diário emocional** | Registro de emoções com histórico, remoção de registros e níveis de progresso (gamificação). |
| **Metas** | Metas semanais de rotina com progresso salvo no dispositivo e visualização do plano terapêutico. |
| **Respiração guiada** | Exercício animado de respiração com mensagens de apoio. |
| **Profissionais** | Lista de clínicos com busca e filtro por especialidade, e tela de agendamento. |
| **Perfil** | Dados do usuário; o responsável vê os pacientes vinculados a ele. |

### Controle de acesso (RLS)

Toda regra de permissão fica no banco, não no app:

- O **paciente** lê e escreve apenas o próprio diário.
- O **clínico** só enxerga pacientes com quem tem plano terapêutico — e apenas lê o diário.
- O **responsável** acompanha (somente leitura) os pacientes vinculados a ele.
- Ninguém consegue se autoaprovar ou trocar o próprio tipo de usuário (gatilho `protect_usuario_fields`).

## 🛠 Tecnologias

- **App:** React Native 0.81, Expo SDK 54, Expo Router (rotas por arquivo), TypeScript
- **UI:** design system próprio (cores pastel, Inter), lucide-react-native, expo-linear-gradient, Animated API
- **Backend:** Supabase — PostgreSQL, Auth, Row Level Security, funções e gatilhos em PL/pgSQL
- **Hospedagem web:** Vercel ou Netlify (export estático do Expo)
- **Mobile:** EAS Build (APK / AAB / iOS)

## 🗂 Estrutura

```
app/                 # telas (Expo Router)
  (tabs)/            # abas: início, diário, metas, profissionais, perfil
  login.tsx, register.tsx, respirar.tsx, agendar.tsx
components/          # componentes reutilizáveis (botões, cards, fundo animado)
contexts/            # AuthContext — sessão e perfil do usuário
lib/                 # cliente Supabase e funções de acesso a dados
supabase/            # banco.sql (schema + RLS + seed) e reset-demo.sql
docs/                # guia de hospedagem e documentação do TCC
```

## 💻 Rodando localmente

Pré-requisitos: **Node.js 20+** e uma conta gratuita no [Supabase](https://supabase.com).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env        # e preencha com a URL e a chave do seu Supabase

# 3. Criar o banco: abra supabase/banco.sql, copie tudo e rode no
#    SQL Editor do Supabase

# 4. Rodar
npm run web                 # abre no navegador
npm start                   # QR code para abrir no celular com o app Expo Go
```

Para publicar na internet, siga o passo a passo em **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## 🧭 Próximos passos

Itens previstos no TCC que ainda não estão no app:

- [ ] Jogos cognitivos com pontuação (`pontuacao_game` já existe no banco)
- [ ] Timer de foco (Pomodoro)
- [ ] Clínico criar e editar planos terapêuticos pelo app
- [ ] Agendamento salvo no banco (hoje é apenas a interface)
- [ ] Relatórios clínicos e gráficos de evolução emocional
- [ ] Testes automatizados

## 👥 Equipe

Projeto desenvolvido em grupo por **Deyse Barbosa Medeiros Soares**, Gabrielly Vitória Macedo Tavares, João Miguel Oliveira Souza, Rafaele Cese Garcia e Tatiana Peixoto Pereira, sob orientação do Prof. Analder Magalhães.

Esta versão (1.1) foi reorganizada, corrigida e publicada por **Deyse Soares** — veja [CHANGELOG.md](CHANGELOG.md).
