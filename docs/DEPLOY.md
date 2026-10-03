# Como hospedar o NeuroFlow (passo a passo)

O NeuroFlow tem duas partes:

1. **Banco + login** → Supabase (gratuito)
2. **App web** → Vercel *ou* Netlify (gratuito)

Opcional: gerar **APK Android** com o EAS (também gratuito).

Tempo estimado: ~30 minutos.

---

## 1. Supabase (banco de dados)

> Se o projeto do grupo no Supabase ainda existe e você tem acesso, pode reaproveitá-lo. Caso contrário (ou se ele pertence a outra pessoa do grupo), crie um seu — é o mais seguro para o portfólio.

1. Acesse [supabase.com](https://supabase.com) → **New project**. Escolha um nome (ex.: `neuroflow`), uma senha de banco e a região **South America (São Paulo)**.
2. Quando o projeto terminar de criar, vá em **SQL Editor → New query**.
3. Abra o arquivo `supabase/banco.sql`, copie **todo** o conteúdo, cole e clique em **Run**.
   - Deve aparecer “Success”. Isso cria as tabelas, as regras de segurança e as contas de demonstração.
4. Vá em **Project Settings → API** e anote:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon / publishable key**
5. **Authentication → URL Configuration**: depois do passo 2 (quando tiver o link do site), coloque o endereço do site em **Site URL**. Isso faz os e-mails de confirmação/recuperação de senha apontarem para o lugar certo.
6. (Opcional) **Authentication → Providers → Email → Confirm email**:
   - Ligado: quem se cadastra precisa clicar no link do e-mail.
   - Desligado: o cadastro entra direto (mais prático para recrutadores testarem).

### Aprovação manual de contas (opcional)

Por padrão, novas contas já entram **ativas**. Para voltar ao fluxo do TCC (administrador aprova):

```sql
CREATE OR REPLACE FUNCTION public.default_user_status()
RETURNS public.status_usuario LANGUAGE sql IMMUTABLE
AS $$ SELECT 'pendente'::public.status_usuario $$;
```

Para aprovar alguém: **Table Editor → usuarios** → mude `status` para `ativo`.

---

## 2. Testar no seu computador (recomendado antes de publicar)

```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
```

Edite o `.env` com a URL e a chave do passo 1, depois:

```bash
npm run web
```

Entre com uma conta demo (ex.: `lucas@neuroflow.app` / `Senha@123`). Se funcionar aqui, vai funcionar na hospedagem.

---

## 3. Publicar a versão web

### 3.1 Colocar o código no GitHub

1. Crie um repositório novo em [github.com/new](https://github.com/new) (ex.: `neuroflow`), **público** para aparecer no portfólio.
2. Na pasta do projeto:

```bash
git init
git add .
git commit -m "NeuroFlow v1.1 — versão portfólio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/neuroflow.git
git push -u origin main
```

> O `.env` **não** vai para o GitHub (está no `.gitignore`). Isso é proposital.

### 3.2a Vercel (opção recomendada)

1. Entre em [vercel.com](https://vercel.com) com sua conta do GitHub → **Add New → Project** → importe o repositório `neuroflow`.
2. Framework: **Other** (o `vercel.json` já configura tudo).
3. Em **Environment Variables**, adicione:
   - `EXPO_PUBLIC_SUPABASE_URL` = sua Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = sua anon key
   - `EXPO_PUBLIC_DEMO_MODE` = `true`
4. **Deploy**. Em ~2 minutos você recebe um link `https://neuroflow-xxxx.vercel.app`.

### 3.2b Netlify (alternativa)

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → GitHub → `neuroflow`.
2. O `netlify.toml` já define o build. Em **Site configuration → Environment variables**, adicione as mesmas 3 variáveis.
3. **Deploy**.

> Mudou alguma variável? Faça um novo deploy — as variáveis `EXPO_PUBLIC_*` entram no código na hora do build.

### 3.3 Finalizar

- Volte ao Supabase (passo 1.5) e coloque o link do site em **Site URL**.
- Coloque o link no `README.md` (seção Demonstração) e no seu portfólio / LinkedIn.

---

## 4. (Opcional) APK para Android

1. Em `eas.json`, dentro de `build.preview`, adicione as variáveis (a anon key é pública, pode ficar no arquivo):

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sua-chave",
    "EXPO_PUBLIC_DEMO_MODE": "true"
  }
}
```

2. Rode:

```bash
npm install -g eas-cli
eas login
eas init                 # cria o projeto no Expo e grava o projectId
eas build -p android --profile preview
```

No fim, o EAS mostra um link para baixar o `.apk`, que você pode instalar no celular ou disponibilizar no portfólio.

---

## Manutenção da demo

Visitantes podem apagar registros ou trocar dados das contas demo. Para restaurar sem perder contas reais, rode `supabase/reset-demo.sql` no SQL Editor.

> Rodar o `banco.sql` de novo **apaga todos os dados** das tabelas do app (inclusive de quem se cadastrou). Use só para recomeçar do zero.

## Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| Tela branca / “Invalid API key” | Variáveis de ambiente faltando ou com espaço extra. Confira e refaça o deploy. |
| “E-mail ou senha incorretos” com a conta demo | O `banco.sql` não rodou até o fim, ou alguém trocou a senha → rode `reset-demo.sql`. |
| “Perfil não encontrado” | Usuário existe no Auth mas não em `usuarios` (ex.: criado antes do `banco.sql`). Apague-o em **Authentication → Users** e cadastre de novo. |
| `npm install` reclama de versões / “peer dependency” | Rode `npx expo install --fix` e depois `npm install` de novo. |
| Página 404 ao recarregar uma rota | Faltou a regra de rewrite — confira se `vercel.json`/`netlify.toml` estão no repositório. |
| E-mail de confirmação leva para `localhost` | Ajuste a **Site URL** no Supabase (passo 1.5). |
