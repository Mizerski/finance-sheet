# Como contribuir

Obrigado pelo interesse! Correções, melhorias de interface, novas funcionalidades e documentação são bem-vindas.

## Antes de começar

1. Leia [Como rodar](como-rodar.md) e deixe o app funcionando na sua máquina. O app desktop (`npm run desktop`) é o caminho mais curto, porque não precisa de Supabase.
2. Passe pelas [Convenções](convencoes.md) e, se for mexer na interface, pelo [Design system](design-system.md).
3. Para algo maior que uma correção pequena, **abra uma issue antes** descrevendo o problema e a ideia. Assim a gente combina o caminho antes de você investir tempo.

## Fluxo de trabalho

1. Faça um fork e crie uma branch a partir de `main`, com o prefixo `feature/` e um nome curto em português:

   ```bash
   git checkout -b feature/exportar-csv
   ```

   Correções também podem usar `fix/`.

2. Trabalhe em **etapas pequenas**. Cada etapa deve deixar algo visível e funcionando na tela, sem placeholder vazio na rota principal. Isso facilita a revisão.
3. Faça commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em português e no imperativo curto:

   | Tipo | Quando | Exemplo |
   |---|---|---|
   | `feat` | Funcionalidade nova | `feat: recorrência semanal` |
   | `feat(<feature>)` | Funcionalidade restrita a uma tela | `feat(planilha): adicionar lançamento pelo dia da tabela` |
   | `fix` | Correção de bug | `fix: saldo do dia 31 em meses curtos` |
   | `docs` | Só documentação | `docs: como rodar a versão web` |
   | `ci` | Pipelines | `ci: build de teste nas branches feature` |
   | `chore` | Versão, dependências, manutenção | `chore: versão 0.3.0` |

4. Antes de abrir o pull request, rode:

   ```bash
   npm run lint
   npm run build
   ```

5. Abra o pull request para `main`. A cada push numa branch `feature/**`, a pipeline de [build de teste](../.github/workflows/build-teste.yml) roda o lint, a checagem de tipos e gera os instaladores do Windows (em **Actions → a execução → Artifacts**), para quem revisa poder testar o app de verdade.

## Checklist do pull request

- [ ] `npm run lint` e `npm run build` passam sem erro.
- [ ] A mudança segue as [convenções](convencoes.md): package by feature, nomes em português, dinheiro em centavos, datas em `DataISO`, lógica fora dos componentes.
- [ ] Ação nova no estado tem caso no reducer, em `persistir` (Supabase) e, se não for salva, na lista de ignoradas do armazenamento local.
- [ ] Mudou o formato dos dados? `VERSAO_DADOS` aumentou e os dados antigos (arquivo e backups) são convertidos ao carregar.
- [ ] Tabela ou coluna nova no banco? Há uma **migração nova** em `supabase/migrations/`, com `user_id` e RLS.
- [ ] Mudança visual segue o [checklist do design system](design-system.md#checklist-antes-de-entregar-uma-tela), foi testada em 375px, ~1100px e 1440px, e nenhuma informação que já existia sumiu da tela.
- [ ] Funciona nas duas plataformas (web e desktop), ou a diferença é intencional e está explicada.
- [ ] O pull request descreve o que mudou e por quê, com um print quando a mudança é visual.
- [ ] O README ou os documentos de `docs/` foram atualizados, se a mudança afeta o que está escrito neles.

## O que evitar

- Adicionar testes unitários ou instalar Vitest sem conversar antes (veja [Testes](convencoes.md#testes)).
- Usar a paleta padrão do Tailwind (`red-500`, `slate-*`…) ou cores em hex no JSX: use os tokens do design system.
- Adicionar fontes, bibliotecas de componentes ou de estado novas sem discutir.
- Colocar a chave `service_role` ou qualquer segredo no front-end ou no repositório.
- Editar uma migração que já foi publicada: crie uma nova.

## Publicar uma versão

Quem mantém o repositório publica as versões. A pipeline [`release.yml`](../.github/workflows/release.yml) gera os instaladores do Windows e os publica numa Release do GitHub.

1. Atualize `version` no `package.json` (o Tauri lê de lá) e em `src-tauri/Cargo.toml`.
2. Faça o commit (`chore: versão X.Y.Z`) e crie a tag com a mesma versão:

   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```

A release só é publicada se os instaladores forem gerados; se algo falhar, ela fica como rascunho e é reaproveitada quando a tag for enviada de novo. macOS e Linux já estão preparados na matriz da pipeline, comentados.

### Atualização automática

O app desktop confere, ao abrir, o `latest.json` da última release e oferece instalar a versão nova (`src/features/atualizacao/`). A pipeline assina as atualizações e sobe esse arquivo; o app só instala o que estiver assinado com a chave do projeto.

- A chave pública fica em `plugins.updater.pubkey` (`src-tauri/tauri.conf.json`). A privada e a senha ficam nos secrets `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` do repositório. Sem eles, a release falha antes de gerar os instaladores.
- A assinatura só é ligada na release (`src-tauri/tauri.release.conf.json`), então `npm run desktop:build` e o build de teste não precisam da chave.
- **Não perca a chave privada.** Os apps instalados só aceitam atualizações assinadas com ela; sem a chave, cada pessoa teria que baixar o instalador de novo à mão. Guarde uma cópia fora do repositório.
- Em desenvolvimento (`npm run desktop`) o app não procura atualizações.

## Dúvidas

Abra uma [issue](https://github.com/Mizerski/finance-sheet/issues). Relatos de bug ajudam mais com: o que você fez, o que esperava, o que aconteceu, a plataforma (web ou desktop, e o sistema operacional) e um print, se der.
