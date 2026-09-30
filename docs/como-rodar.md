# Como rodar

O mesmo código gera duas versões do app. Escolha a que você quer rodar:

- **[Desktop](#app-desktop)**: não precisa de conta em lugar nenhum. Os dados ficam num arquivo local. É o jeito mais rápido de ver o app funcionando, mas pede o Rust instalado.
- **[Web](#versão-web)**: login por e-mail e senha, dados no Supabase. Precisa de um projeto Supabase (o plano gratuito basta).

Só quer usar o app? [Baixe o instalador para Windows](https://github.com/Mizerski/finance-sheet/releases/latest); não precisa compilar nada.

## Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| [Node.js](https://nodejs.org) | 20.19+ ou 22.12+ (use a LTS atual) | Tudo |
| [Git](https://git-scm.com) | qualquer recente | Clonar o repositório |
| [Rust](https://rustup.rs) | 1.90 ou mais recente | Só o app desktop |
| Conta no [Supabase](https://supabase.com) | — | Só a versão web |

```bash
git clone https://github.com/Mizerski/finance-sheet.git
cd finance-sheet
npm install
```

## App desktop

### Requisitos do Windows

- Rust com a toolchain `stable-x86_64-pc-windows-msvc` (o padrão do `rustup` no Windows).
- Microsoft C++ Build Tools, com a carga de trabalho **Desenvolvimento para desktop com C++**.
- WebView2 (já vem no Windows 10 e 11 atualizados).

No macOS e no Linux, siga os [pré-requisitos do Tauri](https://tauri.app/start/prerequisites/). O código já está preparado, mas por enquanto só o Windows é testado e publicado.

> O Rust fica em `%USERPROFILE%\.cargo\bin`. Se o terminal não encontrar o `cargo`, acrescente essa pasta ao `PATH` e abra o terminal de novo.

### Rodar

```bash
npm run desktop
```

A primeira vez demora alguns minutos, porque o Rust compila as dependências. O Vite sobe na porta fixa `1420` e a janela do app abre sozinha, com recarga automática ao salvar os arquivos do front.

Os dados ficam em `%APPDATA%\io.github.mizerski.projecaofinanceira\financas.json` no Windows. Para começar do zero, feche o app e apague esse arquivo (faça um backup antes, pelo botão no cabeçalho, se os dados importarem).

### Gerar os instaladores

```bash
npm run desktop:build
```

Os instaladores ficam em `src-tauri/target/release/bundle/`: `nsis/*-setup.exe` e `msi/*.msi`.

## Versão web

### 1. Criar o banco no Supabase

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Aplique as migrações de [`supabase/migrations/`](../supabase/migrations/), **todas, em ordem de nome** (a data no começo do nome define a ordem). Elas criam as tabelas e as regras de acesso (RLS). Há dois jeitos:
   - **Pelo painel:** em **SQL Editor → New query**, cole o conteúdo de cada arquivo e clique em **Run**, um de cada vez.
   - **Pela CLI:**

     ```bash
     npx supabase link --project-ref <ref-do-projeto>
     npx supabase db push
     ```

3. Em **Authentication → URL Configuration**, defina a **Site URL** como `http://localhost:5173`. É para onde aponta o link de confirmação de e-mail.

### 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto (**Project Settings → API Keys**):

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use a chave **publishable** (ou a antiga **anon**). **Nunca** coloque a `service_role` ou a secret key no front-end: tudo o que começa com `VITE_` vai para o navegador. O `.env.local` não é versionado.

### 3. Rodar

```bash
npm run dev
```

Abra `http://localhost:5173`, crie sua conta e confirme o e-mail. Depois:

1. Informe o saldo inicial na Planilha.
2. Crie categorias em Organização.
3. Cadastre os lançamentos.

A porta muda se a variável `PORT` estiver definida.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento da versão web (porta `$PORT` ou `5173`) |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção em `dist/` |
| `npm run lint` | Lint com o [oxlint](https://oxc.rs) |
| `npm run preview` | Serve o build de `dist/` para conferir |
| `npm run desktop` | App desktop em desenvolvimento (Vite na porta `1420`) |
| `npm run desktop:build` | Instaladores do app desktop |

Antes de abrir um pull request, rode `npm run lint` e `npm run build`: a pipeline roda os dois.

## Problemas comuns

**A tela pede para conectar o Supabase.** Falta o `.env.local` ou uma das duas variáveis. Confira os nomes e reinicie o `npm run dev`, porque o Vite só lê o arquivo ao subir.

**Não consigo entrar logo depois de criar a conta.** O Supabase pede a confirmação do e-mail. Abra o link que chegou; se ele apontar para outro endereço, ajuste a **Site URL** (passo 3 do banco).

**Erro ao salvar ou tabela que não existe.** Alguma migração ficou de fora. Confira se todas as de `supabase/migrations/` foram aplicadas, em ordem.

**`cargo` não encontrado ao rodar `npm run desktop`.** Veja a nota sobre o `PATH` em [Requisitos do Windows](#requisitos-do-windows).

**A porta 1420 já está em uso.** O app desktop precisa dessa porta (ela está no `devUrl` de `src-tauri/tauri.conf.json`). Feche o outro `npm run desktop` ou o processo que a ocupa.
