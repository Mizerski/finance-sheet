# Manual do Projeção Financeira (app desktop)

O app substitui uma planilha de controle financeiro. Cada dia do ano tem entradas, saídas e saldo; o saldo de um dia é o do dia anterior mais as entradas menos as saídas. O saldo passa de um ano para o outro. Além do que já aconteceu, o app projeta o futuro: os lançamentos que se repetem (salário, aluguel) aparecem em todos os dias em que vão acontecer, então dá para ver quanto vai sobrar em qualquer dia.

No app desktop os dados ficam só no computador da pessoa, num arquivo local. Não há login nem nuvem.

## Telas (menu no topo, atalhos 1 a 5)
1. **Planilha**: os dias do ano, mês a mês.
2. **Lançamentos**: a lista de tudo que entra e sai, com busca e filtros.
3. **Organização**: categorias, tags, pastas e caixas (abas).
4. **Economias**: metas de economia, reserva de emergência, risco do caixa e sugestões.
5. **Dashboard**: gráficos e totais de um período.

Na janela larga, as telas ficam em abas no cabeçalho; no celular ou na janela estreita, numa barra presa embaixo da tela.

No cabeçalho também ficam: o botão **+ Novo lançamento** (cria um lançamento de qualquer tela), este assistente e o botão **Mais**, com as cores da tela (claro ou escuro), ocultar saldos, o lembrete diário, o backup, os atalhos do teclado e, na versão web, sair da conta.

## Primeiros passos
1. Informar o **saldo inicial**: quanto havia na conta no começo de um dia. Na Planilha, use "alterar saldo inicial". Os dias antes dessa data ficam fora do cálculo. Saldo negativo vale para cheque especial.
2. Criar **categorias** de entrada e de saída em Organização (ex.: Salário, Mercado, Transporte).
3. Cadastrar os **lançamentos**: salário, contas fixas e gastos do dia a dia.

## Lançamentos
- **Novo lançamento**: botão **+ Novo lançamento** no cabeçalho (qualquer tela), tecla **N**, ou clicar num dia da Planilha e em "Adicionar lançamento".
- **Ver um lançamento ou uma meta**: clique nele (na lista de Lançamentos, no item do dia da Planilha ou no cabeçalho da meta) para abrir o **extrato**, como uma nota: valor, categoria, parcelas, próximas vezes (ou, na meta, quanto já tem, o plano e os últimos movimentos). O botão **Editar** fica ali.
- **Mensal**: o dia de todo mês é o dia do **Começa em** (começou em 06/10 → todo dia 6).
- **Modo simples**: para quem se perde com muitos campos. Ligue em Mais → Modo simples (ou no link "Prefere uma pergunta de cada vez?" do formulário). O novo lançamento passa a ser feito uma pergunta por vez: entrou ou saiu, quanto, categoria, se o gasto era necessário (tag), quando, e uma tela para conferir antes de salvar. Editar também é mais simples: abre direto numa tela de conferência, com **Mudar** em cada linha. Meta nova e caixa novo também: para que é o dinheiro, onde fica, quanto juntar e quanto por mês (meta); que dinheiro é, nome, fatura (cartão) e quanto tem hoje (caixa). Nada some do app: "Ver todos os campos de uma vez" abre o formulário completo.
- Campos: **Tipo** (Entrada ou Saída), **Caixa** (só com 2 ou mais caixas), **Descrição**, **Valor**, **Categoria**, **Natureza** (Fixa ou Variável), **Tag** (só em saídas, opcional), **Pasta** (opcional) e **Recorrência**.
- **Transferência** (terceiro tipo, só com 2 ou mais contas): dinheiro que muda de conta, como guardar na poupança. Campos **Sai de** e **Entra em** (só contas, não benefícios), sem categoria nem tag. Na Planilha da conta de origem ela aparece como saída (em Fixas se repete, em Diário se é única) e na de destino como entrada. Não conta como gasto nem como entrada nos relatórios, e no Total as transferências entre contas do total se anulam.
- **Natureza**: Fixa é conta que se repete com valor certo (aluguel, internet); Variável é gasto do dia a dia (mercado, lanche). Na Planilha, as saídas fixas e as variáveis ficam em colunas separadas.
- **Recorrência**:
  - **Única**: acontece uma vez, numa data.
  - **Mensal**: todo mês num dia (ex.: todo dia 5). Se o mês não tem o dia (31 em abril), usa o último dia.
  - **Semanal**: em dias da semana escolhidos (ex.: toda terça).
  - **Diária**: todos os dias ou só dias úteis.
- Um lançamento que se repete pode ter **início** e **fim** (ex.: parcelas de março a junho). Sem fim, repete para sempre.
- **Compra parcelada**: lançamento Mensal, e em **Até quando?** escolha **Algumas vezes** (ex.: 10). Diga se o valor digitado é **de cada vez** ou **o total** (o app divide: R$ 12.000 em 12 vezes vira 12 × R$ 1.000). O app mostra o total e a data da última parcela. Na lista de Lançamentos, a linha mostra quantas já foram e quanto falta ("2 de 10 · faltam R$ 1.400,00"), com uma barrinha.
- **Mudar só um dia** (salário que veio diferente, conta que chegou com outro valor, mês sem academia): na Planilha, clique no dia e, no lançamento que se repete, no ícone de calendário ("Mudar só neste dia"). Dá para pôr outro valor só naquele dia ou "Pular este dia"; os outros meses continuam iguais. O dia mudado mostra "só neste dia" e o valor normal; o pulado aparece riscado, com um botão para voltar. No formulário do lançamento, "Mudado só em alguns dias" lista esses dias, e o × volta cada um ao normal.
- Ao mudar um lançamento que já aconteceu, o app pergunta se a mudança vale **"Daqui para frente"** (o passado fica como estava) ou **"Desde o início"**.
- Categoria, tag e pasta podem ser criadas no próprio formulário: opção "Nova categoria", "Nova tag" ou "Nova pasta" no fim da lista.
- Para editar ou excluir: na lista de Lançamentos, botões da linha; ou clicando no dia da Planilha (clicar no lançamento edita, a lixeira ao lado exclui). Excluir não tem volta; num lançamento que se repete e já aconteceu, "Encerrar" para a partir de hoje e mantém o passado.
- **Busca e filtros** (Lançamentos): busca pela descrição (tecla **/**), filtro por tipo (inclusive Transferências, quando há alguma), natureza, categoria, tag e data. Com filtro de data, a lista mostra só o que acontece no período e quantas vezes cada lançamento se repete.
- **Ordenar a lista**: clique no nome de uma coluna (Descrição, Categoria, Tag, Natureza, Recorrência, Valor). Clicar de novo inverte; na terceira vez, volta à ordem normal (entradas primeiro). Com pastas, a ordem vale dentro de cada pasta.
- **Vários de uma vez** (tela larga): marque os quadradinhos (Shift+clique marca um intervalo) e use a barra de baixo para trocar categoria, tag, pasta ou caixa, ou excluir. Dá para desfazer logo depois. Esc desmarca.

## Planilha
- Mostra 1, 2 ou 3 meses lado a lado, conforme a largura da tela. Setas ← → trocam de mês; **T** volta para hoje.
- Colunas: **Dia**, **Entradas** (azul), **Saídas fixas** (vermelho), **Diário** (saídas variáveis do dia, vermelho), **Economia** (amarelo, só se houver metas) e **Saldo**.
- Clique num dia para ver os lançamentos dele, o saldo do dia e adicionar um lançamento.
- O fundo da célula de saldo tem a cor do **risco** daquele dia (veja Risco do caixa).
- No topo da Planilha, três números grandes: o **saldo de hoje** (e quanto está separado nas metas), o **saldo no fim do mês** e o **risco**, com o dia mais apertado e um link para Economias. O "?" ao lado do risco explica o nível. O nível de cada mês aparece no cabeçalho do mês.
- **Conferir saldo**: informe quanto o banco mostra num dia. Se a planilha estiver diferente, a diferença vira um lançamento de ajuste. Ajustes não contam como entrada nem como gasto nos relatórios.

## Cores do app
- Azul = entrada. Vermelho = saída. Amarelo = economia (metas). Saldo negativo aparece em vermelho escuro.

## Organização
- **Categorias**: de entrada ou de saída, cada uma com cor. Servem para os gráficos de gastos.
- **Tags**: só em saídas, no máximo uma por lançamento. Dizem se o gasto era necessário ou evitável (ex.: "Superficial"). Tag marcada como **evitável** entra no total de gastos evitáveis do Dashboard.
- **Pastas**: só organizam a lista de lançamentos em grupos (ex.: "Casa", "Viagem"). Não mudam a projeção.
- **Caixas**: veja abaixo.
- Excluir uma tag ou pasta deixa os lançamentos sem ela.

## Caixas (contas, benefícios e cartões)
- Um **caixa** é uma conta (banco, carteira), uma **conta de investimento** (poupança, CDB, corretora), um **benefício** (vale-refeição, vale-alimentação) ou um **cartão de crédito**. Cada um tem saldo inicial e data próprios. Cadastro na aba Caixas de Organização.
- Com 2 ou mais caixas, aparece o **seletor de caixa** no cabeçalho, ao lado do saldo: escolha **Total** (soma das contas) ou um caixa. Atalhos **Alt+0** (Total) e **Alt+1…9**. O formulário de lançamento ganha o campo Caixa.
- **Benefício**: o dinheiro só paga alguns gastos, por isso fica fora do Total e não tem risco nem metas. A recarga é uma entrada no caixa do benefício. O app mostra quanto sobra até a próxima recarga e quanto dá para gastar por dia, e avisa se o saldo acaba antes.
- **Investimento**: conta para o dinheiro aplicado. Fica fora do risco do caixa, não paga cartão e não é de onde uma meta tira dinheiro; começa fora do Total (dá para mudar em Mais opções). Rendimentos podem ser lançados como entradas nela. Numa meta, escolha "Em outra conta" e a conta de investimento em **Vai para**: cada aporte vira uma transferência para lá, e o saldo que ela já tem (com rendimentos) conta como guardado na meta, no lugar de "Já tenho guardado". Cada conta de investimento fica com uma meta só.
- **Cartão de crédito**: informe o dia em que a fatura fecha, o dia do vencimento, a conta que paga e quanto você deve hoje (fatura fechada mais a aberta); o limite é opcional, em Mais opções. Cada compra é uma saída do caixa do cartão (parcelado: saída Mensal com "Até quando? → Algumas vezes"). No fechamento, tudo o que você deve vira a fatura, e o app tira o valor sozinho da conta pagadora no vencimento: não precisa lançar o pagamento. Na Planilha do cartão, o card **Fatura** mostra a fatura aberta (com as compras já lançadas até o fechamento), a fechada que vai vencer e o limite livre, e avisa se passou do limite. Na conta que paga, a fatura aparece no dia do vencimento como "Fatura <cartão>" e entra no risco dela. Cartão não tem risco nem metas.
- **Conferir fatura** (botão no topo da Planilha, com o cartão escolhido no seletor): escolha a fatura que fechou (uma das três últimas), informe o valor que o banco mostra, e a diferença vira um "Ajuste de saldo" no cartão no dia do fechamento (fora dos gastos). A fatura passa a sair da conta com o valor do banco.
- "Soma no total" (em Mais opções, para conta e cartão): escolha Não para uma conta que fica de lado, como poupança ou investimento. Com o cartão no Total, o que você deve nele já desconta do Total no dia da compra.
- Para mover dinheiro de uma conta para outra, use um lançamento do tipo **Transferência** (veja Lançamentos).
- Só dá para excluir um caixa sem lançamentos nem metas (e uma conta que não paga nenhum cartão); senão, arquive.

## Economias
- **O topo** da tela, logo abaixo do título, mostra três números: o **risco do caixa** (o nível e para quantos dias de gastos dá no dia mais apertado), quanto já está **nas metas** e quanto **dá para guardar a mais** por mês. Embaixo, a frase do dia mais apertado e o **mês a mês** em barras: cada barra é quanto sobra no dia mais apertado do mês (mais alta, mais folga) e a cor é o nível.
- O resto fica em seções que abrem e fecham pelo título (a seta): **Suas metas**, **Guardar mais** (quanto cabe por mês, a reserva de emergência e as sugestões), **Pela frente** (contas grandes e o simulador) e **Histórico do ano** (as sobras; começa fechada). Fechada, a seção ainda mostra a conclusão numa linha.
- **Ver uma meta**: clique em qualquer parte do card (ou em **Ver extrato**) para abrir o extrato dela.
- **Metas de economia**: botão "Nova meta". Campos: nome, **Quero juntar** (valor alvo, opcional), **Guardar por mês** (aporte), **Dia do aporte**, **A partir de** e **Até quando** (prazo, opcional, só com valor alvo). Cada meta é de uma conta.
- **Já tenho guardado** (opcional): o dinheiro que você já juntou fora do app antes de criar a meta. Conta para o progresso e para o que dá para usar, e a meta termina mais cedo, mas não mexe no saldo.
- Sem valor alvo, a meta é um **cofrinho**: guarda todo mês, sem fim, e o card mostra quanto já foi guardado e quanto terá em 12 meses.
- **Onde fica o dinheiro** (com 2 ou mais contas): **Separado na conta** (padrão; sai do disponível, mas continua na conta, como as caixinhas dos bancos) ou **Em outra conta** (cada aporte vira uma transferência para a conta escolhida, como uma poupança).
- O saldo da Planilha é o **disponível**. O dinheiro separado nas metas aparece ao lado do saldo inicial ("R$ … separados nas metas") e na dica do saldo de hoje no cabeçalho. Em "Conferir saldo", escolha se o banco mostra o saldo **com o separado** ou **só o disponível**.
- **Usar dinheiro** (botão no card da meta): tira dinheiro da meta, que volta para o disponível da conta no dia escolhido (pode ser no futuro, como o dia da viagem). Com valor alvo, a meta volta a guardar até completar de novo, a não ser que você escolha **Parar esta meta** (fica encerrada; "Voltar a guardar" reabre). Para um gasto grande, dá para juntar numa meta e usar o dinheiro dela no dia do pagamento.
- Deixando **Guardar por mês** em branco, o app **sugere** um valor: o maior que não piora o risco do caixa (botão "Usar"). Com prazo, também diz quanto guardar para chegar a tempo.
- No dia do aporte, o dinheiro guardado sai do saldo e aparece em amarelo na coluna Economia da planilha. Os aportes param quando a meta é atingida.
- Com prazo, o app calcula quanto guardar por mês para chegar a tempo e diz se esse valor **cabe no seu bolso** (se o saldo continua positivo nos próximos 12 meses).
- Se um mês fugiu do plano, dá para registrar o valor real guardado naquele mês.
- **Meta principal**: a próxima a terminar entre as em andamento; aparece no Dashboard com marcos de 25%, 50%, 75% e 100%.
- **Quanto dá para guardar** (seção Guardar mais): quanto ainda dá para guardar por mês sem piorar o risco do caixa nos próximos 12 meses. No mesmo card fica a **reserva de emergência**: dinheiro para imprevistos, o gasto essencial (saídas sem tag evitável) vezes 3, 6 ou 12 meses, e em quanto tempo você chega lá guardando o valor que cabe. A meta que tem "reserva" no nome é a reserva.
- **Contas grandes pela frente** (seção Pela frente): contas que não são de todo mês (IPVA, seguro, matrícula) nos próximos 12 meses, com o saldo do dia. Diz se o saldo cobre todas. Não precisam de meta: já saem do saldo no dia certo.
- **Sugestões**: resumo do mês que fechou (nos 7 primeiros dias do mês), guardar metade de um aumento de salário, guardar metade de uma entrada extra grande.
- **Sobras** (seção Histórico do ano): quanto sobra por mês (entradas − saídas − metas).

## Risco do caixa
- Prevê quanto dinheiro sobra na conta de hoje até o fim do 12º mês seguinte. Compara o saldo de cada dia com o **gasto de um mês** (as saídas de um mês normal).
- O nível da conta é o do **dia mais apertado** (o dia de menor saldo nesse período). Aparece no topo de Economias, no resumo do topo da Planilha e na cor do saldo de cada dia.
- Níveis, pelo saldo do dia mais apertado:
  - **Tranquilo**: sobra metade de um mês de gastos ou mais.
  - **Estável**: sobra de um quarto até metade de um mês de gastos.
  - **Atenção**: sobra de 10% até um quarto de um mês de gastos. Ainda não falta dinheiro, mas a folga é pequena.
  - **Risco alto**: sobra de 5% até 10% de um mês de gastos.
  - **Risco muito alto**: sobra menos de 5% de um mês de gastos, ou o saldo fica negativo (falta dinheiro).
- **Posso assumir uma conta nova?** (Economias, seção Pela frente): você informa o valor e como paga (**uma vez**, **parcelado** ou **todo mês**), e o app mostra o nível com ela e os meses lado a lado. No parcelado, diga em quantas vezes e se o valor digitado é **o total** (o app divide) ou **cada parcela**. Também mostra o maior valor que cabe sem piorar o nível.
- Ao criar uma saída, o formulário mostra o efeito dela no risco antes de salvar.
- O que fazer quando o caixa aperta (Atenção ou pior):
  1. Ver no resumo do topo da Planilha (ou no topo de Economias) qual é o dia mais apertado e olhar as saídas que vêm antes dele.
  2. Cortar ou adiar gastos variáveis e os de tag evitável.
  3. Adiar gastos grandes que não são urgentes para depois do dia mais apertado.
  4. Diminuir ou pausar o aporte das metas de economia por um tempo: o aporte sai do saldo da conta.
  5. Evitar assumir contas novas; use o simulador antes.
- Saldo inicial e Conferir saldo não mudam o risco de verdade: só corrigem a planilha para bater com o banco.

## Dashboard
- Escolha o período no topo (dia, semana, mês ou ano). Mostra entradas, saídas, menor saldo, gastos evitáveis, meta principal e gráficos: entradas vs saídas, saldo, sobras, gastos por categoria, por tag, por pasta e por ano.

## Outras funções do app desktop
- **Backup**: botão Mais no cabeçalho → Backup → "Exportar backup" salva um arquivo com todos os dados; "Importar backup" troca os dados atuais pelos do arquivo. Faça backup de vez em quando e guarde em outro lugar.
- **Lembrete diário**: botão Mais no cabeçalho → Lembrete diário. Uma notificação por dia, a partir do horário escolhido, se nenhum lançamento foi salvo no dia. Ali também: fechar a janela deixa o app na bandeja e iniciar com o sistema.
- **Atualização**: o app avisa quando há versão nova; é só clicar em Atualizar.
- **Atalhos**: tecla **?** mostra todos.
- **Ocultar saldos**: o botão de olho no resumo do topo da Planilha (ou Mais → Ocultar saldos, em qualquer tela) borra os saldos (bom para mostrar a tela a alguém).
