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

| Processo    | Dimensão                        | Legado     | Novo                           | Resultado | Categoria                                   | Primeira fronteira provável                                  | Observação                                                                                                                                                        |
| ----------- | ------------------------------- | ---------- | ------------------------------ | --------- | ------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 420583/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | A aba `Importação eComex` armazenou `n�o`, enquanto a Config armazenou `não` íntegro. A fixture preserva o texto semântico informado e não corrige encoding.      |
| 420583/2026 | `openNonBlockingDeviationCount` | 1          | 2                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | As duas descrições semanticamente íntegras são classificadas como `NON_BLOCKING` pelo catálogo atual.                                                             |
| 420573/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | O desvio documental aberto é `NON_BLOCKING` quando a descrição acentuada chega íntegra.                                                                           |
| 420573/2026 | `openNonBlockingDeviationCount` | 0          | 1                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | O desvio de fatura está fechado e o documental aberto conta como `NON_BLOCKING`.                                                                                  |
| 420573/2026 | `digitalOriginal`               | `RECEIVED` | `RECEIVED_WITH_OPEN_DEVIATION` | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | A descrição corrompida não satisfaz o padrão documental legado. Com texto íntegro, a observação eTrack e o desvio aberto coexistem explicitamente no novo Domain. |
| 420575/2026 | `openBlockingDeviationCount`    | 1          | 0                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | O desvio documental aberto é `NON_BLOCKING` quando a descrição acentuada chega íntegra.                                                                           |
| 420575/2026 | `openNonBlockingDeviationCount` | 0          | 1                              | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | A contagem nova preserva a classificação caracterizada do desvio documental.                                                                                      |
| 420575/2026 | `digitalOriginal`               | `RECEIVED` | `RECEIVED_WITH_OPEN_DEVIATION` | MISMATCH  | `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED` | export físico eComex para importação legado no Google Sheets | A descrição corrompida não satisfaz o padrão documental legado. Com texto íntegro, a confirmação eTrack e o desvio aberto coexistem explicitamente.               |

Nenhuma dessas diferenças foi corrigida nesta validação. A corrupção armazenada na planilha está confirmada, mas sua origem deve ser verificada no arquivo físico eComex e no caminho de importação antes de qualquer mudança de decoding, normalização ou regra.

## Investigação de encoding da Etapa 22

A inspeção direta da aba `Importação eComex` confirmou `Documentos originais n�o recebidos do Agente de Carga` nos processos `420573/2026`, `420575/2026` e `420583/2026`. O caractere de substituição Unicode U+FFFD está presente em `userEnteredValue` e `effectiveValue`. Na aba `⚙️ Config`, a descrição `Documentos originais não recebidos do Agente de Carga` está armazenada integralmente e classificada como `Não impeditivo`.

Isso comprova que a planilha legado possui duas representações diferentes e explica os efeitos observados:

- a descrição importada corrompida não encontra a descrição íntegra da Config e cai no fallback `BLOCKING`;
- `n�o` não satisfaz o padrão documental `n[aã]o`, impedindo as flags digital e física quando essa descrição é exigida.

A origem da corrupção continua indeterminada. O workspace e todo o histórico Git foram examinados e não contêm CSV, TXT, XLSX, ZIP ou outra amostra real da exportação eComex. Portanto não foi possível inspecionar BOM, sequências de bytes, validade UTF-8, compatibilidade com Windows-1252 ou ISO-8859-1, nem determinar se U+FFFD já estava materializado no arquivo original como `EF BF BD`.

O resultado investigativo atual corresponde ao caso D: nenhuma amostra real disponível. Para avançar, é necessário o arquivo original eComex usado no snapshot, ou uma exportação equivalente preservada byte a byte antes da importação no Google Sheets. O arquivo deve permitir verificar ao menos nome e versão da exportação, bytes originais e hash, sem ser adicionado ao Git.

Nenhuma substituição de U+FFFD, heurística de reparo, decoder ou alteração de catálogo foi implementada. A matriz permanece `63/8/1`; somente o diagnóstico dos oito mismatches passou de suspeita genérica de encoding para `LEGACY_IMPORTED_TEXT_CORRUPTION_CONFIRMED`, com `CORRUPTION_ORIGIN_UNDETERMINED` mantida como questão separada.

## Células legado vazias

- `420579/2026`: o vazio legado de original físico foi traduzido explicitamente como equivalente semântico a `UNIDENTIFIED`, pois ETA e evidência de recebimento estão ausentes. O resultado é `MATCH` e a adaptação permanece anotada na fixture.
- `420573/2026`: o vazio legado de original físico não recebeu equivalência automática. O novo sistema retorna `UNIDENTIFIED`, e a dimensão foi registrada como `NOT_COMPARABLE` com categoria `LEGACY_EMPTY_VS_EXPLICIT_STATE`.

## Limitações da fixture

- As cinco descrições eComex exatas de `420589/2026` não foram fornecidas. A fixture usa cinco linhas `OPEN` distintas que preservam as cinco decisões `BLOCKING` observadas e comprovam que não há deduplicação. A conferência das descrições originais continua necessária.
- A observação do desvio documental de `420583/2026` não foi fornecida. Ela permanece ausente, sem inferência de flag documental.
- A amostra contém somente os oito processos selecionados. Ela não valida cardinalidade, identidade canônica, processamento em lote nem completude da planilha.

## Garantias do harness

O teste do comparador prova igualdade, divergência, ausência de comparabilidade, continuidade das demais dimensões e ordem determinística. O teste do snapshot fixa os oito processos, a data de avaliação, os valores atuais encontrados nas divergências e o total `63/8/1`. Nenhuma regra de produção participa da construção das expectativas legado.
