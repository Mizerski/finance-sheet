# Plano — melhorias de usabilidade

Branch `feature/melhorias-usabilidade`. Vem da revisão de design (nota 3/4). Cada etapa termina com parada para revisão e deixa algo funcionando na tela.

## Etapas

- [x] **1. Editar um recorrente sem reescrever o passado**
  - Ao salvar um lançamento mensal ou diário que já aconteceu antes de hoje, com mudança de valor, tipo, categoria, tag, natureza ou recorrência, o formulário pergunta: "Daqui para frente" (padrão, a partir de hoje ou de uma data escolhida) ou "Desde o início".
  - "Daqui para frente" encerra o lançamento antigo no dia anterior e cria um novo a partir da data. Nada muda no formato dos dados.
  - Excluir um recorrente com ocorrências passadas oferece "Encerrar" (fim ontem, histórico mantido) além de excluir de vez.
- [x] **2. Conferir o saldo com o banco**
  - Botão "Conferir saldo" na Planilha: você informa o saldo real de hoje, o app mostra a diferença e cria um lançamento único "Ajuste de saldo" (entrada ou saída).
- [x] **3. Cabeçalho: saldo claro e sem rolagem horizontal**
  - Mostrar o saldo de hoje e o do fim do ano com rótulos explícitos, também no celular.
  - Corrigir o menu que empurra o botão de backup para fora da tela entre 640px e ~910px.
- [x] **4. Busca e filtros compactos em Lançamentos**
  - Campo de busca pela descrição, guardado em `?q=`.
  - No celular, os quatro filtros viram um botão "Filtros (n)".
  - A tabela precisa de ~824px e rola dentro do card entre ~770px e ~860px; ajustar colunas para caber.
- [ ] **5. Atalhos de teclado**
  - `N` novo lançamento, `T` hoje, `←`/`→` meses na Planilha, `1`–`5` abas, `/` busca, `?` lista de atalhos.

Antes de fazer o merge, apague este arquivo ou marque tudo como feito.
