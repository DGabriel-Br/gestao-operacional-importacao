# Validação diferencial do snapshot legado de 29/09/2026

Este documento registra uma comparação histórica e reproduzível entre o pipeline novo e valores observados na aba `Processamento` do Painel Operacional de Importação. Ele não é a especificação definitiva do produto e não aprova automaticamente o comportamento da planilha.

## Fronteira da validação

- snapshot legado: 29/09/2026;
- `evaluationDate`: `{ year: 2026, month: 9, day: 29 }`;
- entradas congeladas no teste, sem acesso ao Google Sheets, Google Drive, HTTP ou relógio;
- fluxo exercitado: fatos eTrack, projeções individuais eComex, correlação geral, composição documental e `assessCorrelatedOperationalProcess`;
- dimensões: evento, etapa, criticidade, contagens `BLOCKING` e `NON_BLOCKING`, alerta, original digital, original físico e Mercante.

As expectativas legado são dados estáticos. Elas não são produzidas por funções do novo Domain. O comparador usa `MATCH`, `MISMATCH` e `NOT_COMPARABLE`, mantendo todas as dimensões visíveis mesmo quando uma delas diverge.

## Matriz geral

Legenda: `M` significa `MATCH`, `MM` significa `MISMATCH` e `NC` significa `NOT_COMPARABLE`.

| Referência  | Evento | Etapa | Criticidade | Blocking | Non-blocking | Alerta | Digital | Físico | Mercante | Total M/MM/NC |
| ----------- | ------ | ----- | ----------- | -------- | ------------ | ------ | ------- | ------ | -------- | ------------- |
| 420587/2026 | M      | M     | M           | M        | M            | M      | M       | M      | M        | 9/0/0         |
| 420579/2026 | M      | M     | M           | M        | M            | M      | M       | M      | M        | 9/0/0         |
| 420589/2026 | M      | M     | M           | M        | M            | M      | M       | M      | M        | 9/0/0         |
| 420586/2026 | M      | M     | M           | M        | M            | M      | M       | M      | M        | 9/0/0         |
| 420583/2026 | M      | M     | M           | MM       | MM           | M      | M       | M      | M        | 7/2/0         |
| 420573/2026 | M      | M     | M           | MM       | MM           | M      | MM      | NC     | M        | 5/3/1         |
| 420562/2026 | M      | M     | M           | M        | M            | M      | M       | M      | M        | 9/0/0         |
| 420575/2026 | M      | M     | M           | MM       | MM           | M      | MM      | M      | M        | 6/3/0         |
| **Total**   |        |       |             |          |              |        |         |        |          | **63/8/1**    |

Foram avaliadas 72 combinações de processo e dimensão: 63 coincidem, 8 divergem e 1 não possui equivalência semântica suficientemente segura.

## Divergências

| Processo    | Dimensão                        | Legado     | Novo                           | Resultado | Categoria                          | Primeira fronteira provável                                            | Observação                                                                                                                          |
| ----------- | ------------------------------- | ---------- | ------------------------------ | --------- | ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 420583/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | A inspeção externa exibiu caracteres de substituição. A fixture preserva o texto semântico informado e não corrige encoding.        |
| 420583/2026 | `openNonBlockingDeviationCount` | 1          | 2                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | As duas descrições fornecidas são classificadas como `NON_BLOCKING` pelo catálogo atual.                                            |
| 420573/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | O desvio documental aberto é `NON_BLOCKING` quando a descrição acentuada chega íntegra.                                             |
| 420573/2026 | `openNonBlockingDeviationCount` | 0          | 1                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | O desvio de fatura está fechado e o documental aberto conta como `NON_BLOCKING`.                                                    |
| 420573/2026 | `digitalOriginal`               | `RECEIVED` | `RECEIVED_WITH_OPEN_DEVIATION` | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | A observação eTrack confirma recebimento, enquanto o desvio documental aberto reconhecido preserva a inconsistência no novo Domain. |
| 420575/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | O desvio documental aberto é `NON_BLOCKING` quando a descrição acentuada chega íntegra.                                             |
| 420575/2026 | `openNonBlockingDeviationCount` | 0          | 1                              | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | A contagem nova preserva a classificação caracterizada do desvio documental.                                                        |
| 420575/2026 | `digitalOriginal`               | `RECEIVED` | `RECEIVED_WITH_OPEN_DEVIATION` | MISMATCH  | `LEGACY_SOURCE_ENCODING_UNCERTAIN` | representação eComex para projeção individual ou composição documental | A confirmação textual eTrack e o desvio documental aberto coexistem e permanecem explícitos.                                        |

Nenhuma dessas diferenças foi corrigida nesta validação. A origem do caractere de substituição deve ser verificada no arquivo físico eComex e no caminho usado para inspecionar o snapshot antes de qualquer mudança de normalização ou regra.

## Células legado vazias

- `420579/2026`: o vazio legado de original físico foi traduzido explicitamente como equivalente semântico a `UNIDENTIFIED`, pois ETA e evidência de recebimento estão ausentes. O resultado é `MATCH` e a adaptação permanece anotada na fixture.
- `420573/2026`: o vazio legado de original físico não recebeu equivalência automática. O novo sistema retorna `UNIDENTIFIED`, e a dimensão foi registrada como `NOT_COMPARABLE` com categoria `LEGACY_EMPTY_VS_EXPLICIT_STATE`.

## Limitações da fixture

- As cinco descrições eComex exatas de `420589/2026` não foram fornecidas. A fixture usa cinco linhas `OPEN` distintas que preservam as cinco decisões `BLOCKING` observadas e comprovam que não há deduplicação. A conferência das descrições originais continua necessária.
- A observação do desvio documental de `420583/2026` não foi fornecida. Ela permanece ausente, sem inferência de flag documental.
- A amostra contém somente os oito processos selecionados. Ela não valida cardinalidade, identidade canônica, processamento em lote nem completude da planilha.

## Garantias do harness

O teste do comparador prova igualdade, divergência, ausência de comparabilidade, continuidade das demais dimensões e ordem determinística. O teste do snapshot fixa os oito processos, a data de avaliação, os valores atuais encontrados nas divergências e o total `63/8/1`. Nenhuma regra de produção participa da construção das expectativas legado.
