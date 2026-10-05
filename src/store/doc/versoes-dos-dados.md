# Versões dos dados

`VERSAO_DADOS` (`src/store/model/dados.ts`) é o formato de `DadosFinancas` no arquivo local (`financas.json`) e no backup. Mudou o formato? Aumente a versão e converta os dados antigos em `atualizarDados` (arquivo local) e em `lerBackup` (`src/features/backup/utils/backup.ts`).

Quando a versão sobe sem conversão, o número novo serve só para um app antigo não importar um backup que ele leria errado.

| Versão | O que mudou | Conversão |
|---|---|---|
| 2 | Metas de economia | Sem metas, lista vazia |
| 3 | Tags e pastas | Sem tags e pastas, listas vazias |
| 4 | Recorrência semanal | Não |
| 5 | Prazo opcional nas metas | Não (meta sem prazo continua válida) |
| 6 | Caixas | O saldo inicial (`config`) vira a "Conta principal" e todo lançamento e meta ganha `caixaId` |
| 7 | Transferência entre contas (`tipo: 'transferencia'` com `caixaDestinoId`) e meta sem valor alvo (cofrinho) | Não; só a transferência mantém `caixaDestinoId` |
| 8 | O que já estava guardado fora do app ao criar a meta (`jaGuardadoCentavos`) | Não |
| 9 | Valor de um dia só num recorrente (`excecoes`: valor real ou 0 = pulado) | Não |
| 10 | Cartão de crédito (`tipo: 'cartao'` com `cartao`: fechamento, vencimento, conta que paga e limite) | Não |
| 11 | Conta de investimento (`investimento` na conta) | Não |
