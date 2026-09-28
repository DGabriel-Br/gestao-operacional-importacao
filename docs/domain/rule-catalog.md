# Catálogo de regras e comportamentos observados

Este catálogo descreve o comportamento atual relatado da ferramenta. Ele não é uma implementação, não define tipos finais e não aprova automaticamente cada comportamento como requisito futuro.

Os comportamentos marcados como `Relatado` foram fornecidos no briefing operacional da Etapa 2 em 2026-09-26. As famílias `RULE-TRACK`, `RULE-EVENT`, `RULE-STAGE`, `RULE-CRIT`, `RULE-DEV`, `RULE-ALERT` e `RULE-DIGITAL` possuem caracterizações posteriores baseadas na lógica das fórmulas explicitamente descrita pelo Mestre.

## Como interpretar o catálogo

- `Relatado` significa que o comportamento foi fornecido pela operação, mas ainda não foi comprovado por artefatos da planilha neste repositório.
- `A validar` indica conflito, lacuna ou condição incompleta.
- `Princípio aprovado` representa uma restrição de modelagem já aprovada, não uma regra operacional da planilha.
- Toda regra futura deverá ser ligada a cenários caracterizados antes de ser implementada.

## Acompanhamento operacional

Esta família foi caracterizada na Etapa 6 a partir da lógica da fórmula descrita pelo Mestre em 2026-09-26 e reproduzida por testes automatizados do domínio. `Caracterizado` não significa `Aprovado` como regra futura.

A expressão caracterizada para participação é:

```text
hasProcessId
AND NOT hasRegistration
AND (
  hasEstimatedArrival
  OR awaitingTransshipmentConfirmation
  OR (transportMode = maritime AND awaitingBerthingData)
)
```

`hasArrival` não integra a expressão: chegada, isoladamente, não inclui nem exclui o processo. Quando mais de um gatilho é verdadeiro, a decisão preserva todas as razões caracterizadas que a sustentam.

| ID             | Comportamento atual caracterizado                                                                                                  | Resultado                                | Estado e lacunas                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| RULE-TRACK-001 | Existe identificador, `Data Registro` está ausente e existe ETA.                                                                   | Participa da fila operacional principal. | Caracterizado e implementado na Etapa 6. Aprovação de negócio pendente.                                     |
| RULE-TRACK-002 | Existe identificador, registro e ETA estão ausentes, o modal é marítimo e a observação indica espera por dados de atracação.       | Participa da fila operacional principal. | Caracterizado e implementado na Etapa 6 somente para o padrão textual documentado.                          |
| RULE-TRACK-003 | Existe identificador, registro e ETA estão ausentes e a observação indica espera por confirmação de transbordo do agente de carga. | Participa da fila operacional principal. | Caracterizado e implementado na Etapa 6 sem requisito adicional de modal.                                   |
| RULE-TRACK-004 | O processo possui `Data Chegada`, não possui registro e satisfaz ao menos um gatilho de acompanhamento.                            | Continua no acompanhamento.              | Caracterizado e implementado na Etapa 6. Chegada não cria nem encerra o acompanhamento isoladamente.        |
| RULE-TRACK-005 | O processo possui `Data Registro`, mesmo que também possua ETA ou evidência textual de exceção.                                    | Não participa da fila principal.         | Caracterizado e implementado na Etapa 6. O possível controle pós-registro permanece fora desta regra.       |
| RULE-TRACK-006 | Não existe identificador de processo.                                                                                              | Não participa da fila principal.         | Caracterizado e implementado na Etapa 6. Formato, unicidade e estabilidade do identificador seguem abertos. |
| RULE-TRACK-007 | Existe identificador, não existe registro, ETA ou exceção textual aplicável.                                                       | Não participa da fila principal.         | Caracterizado e implementado na Etapa 6. Outros sinais sem ETA permanecem em aberto.                        |

O reconhecimento de transbordo exige, na ordem, fragmentos equivalentes a `agdo`, `confirma`, `transbordo`, `agente` e `carga`. O reconhecimento de atracação exige, na ordem, `aguardando`, `dados` e um termo iniciado por `atraca`. A implementação trata somente caixa, acentos, pontuação e espaços para reproduzir essa correspondência legada; não executa fuzzy matching nem adiciona sinônimos.

Quando existe evidência de atracação e o modal é desconhecido, a implementação retorna elegibilidade `undetermined` e uma issue explícita. Esse tratamento evita converter desconhecimento em exclusão definitiva; o resultado futuro permanece em `Q-FLOW-013`.

## Eventos operacionais

Esta família foi caracterizada na Etapa 7 a partir da fórmula da camada `Processamento` descrita pelo Mestre em 2026-09-26 e reproduzida por testes automatizados. `Caracterizado` não significa `Aprovado`.

| Código estável              | Texto configurado                       |
| --------------------------- | --------------------------------------- |
| `CRITICAL_ANALYSIS_STARTED` | `Processo em análise crítica`           |
| `PENDING_ISSUE_REPORTED`    | `Pendência apontada`                    |
| `PENDING_ISSUES_RETURNED`   | `Recebemos retorno das pendências`      |
| `PROCESS_SENT_TO_TYPING`    | `Processo encaminhado para a digitação` |
| `SENT_TO_TYPING`            | `Encaminhado para digitação`            |
| `DUIMP_GENERATION_ERROR`    | `Erro ao gerar a DUIMP`                 |
| `TYPING_COMPLETED`          | `Digitação OK`                          |
| `PROCESS_SENT_TO_REVIEW`    | `Processo encaminhado para conferência` |
| `SENT_TO_REVIEW`            | `Encaminhado para conferência`          |
| `PROCESS_REVIEWED`          | `Processo conferido`                    |

| ID             | Comportamento atual caracterizado                                                                                                                             | Resultado                                                                                                                  | Estado e lacunas                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| RULE-EVENT-001 | A observação e cada texto configurado são normalizados com o algoritmo legado específico desta família.                                                       | Variações caracterizadas podem corresponder sem igualdade literal do texto bruto.                                          | Caracterizado e implementado na Etapa 7. Aprovação de negócio pendente.                                                 |
| RULE-EVENT-002 | Para cada texto configurado, a busca equivalente a `SEARCH` considera sua primeira ocorrência na observação normalizada. Entre essas posições, vence a maior. | Seleciona o evento cuja primeira correspondência começa mais à direita.                                                    | Caracterizado e implementado. Não representa necessariamente o evento semanticamente mais recente.                      |
| RULE-EVENT-003 | Nenhum texto configurado é encontrado.                                                                                                                        | Evento `UNIDENTIFIED`, equivalente ao legado `Evento não identificado`.                                                    | Caracterizado e implementado. Nenhuma etapa é determinada nesta família.                                                |
| RULE-EVENT-004 | Um evento é reconhecido.                                                                                                                                      | O código do evento permanece independente da futura etapa operacional.                                                     | Distinção conceitual aprovada; reconhecimento implementado; mapeamento para etapa continua fora do escopo.              |
| RULE-EVENT-005 | A observação está ausente, vazia, contém somente espaços ou possui texto sem correspondência.                                                                 | Todos resultam em evento `UNIDENTIFIED`, com reason codes distintos para preservar a condição avaliada.                    | Resultado legado caracterizado; distinção explicativa implementada no domínio. Efeito futuro em etapa permanece aberto. |
| RULE-EVENT-006 | Uma variante curta começa dentro da variante longa de digitação ou conferência.                                                                               | A variante curta vence porque sua primeira correspondência começa mais à direita.                                          | Caracterizado e implementado. As entradas continuam separadas e não foram canonicalizadas.                              |
| RULE-EVENT-007 | Um evento aparece, outro evento aparece depois e o primeiro evento volta a aparecer ao final.                                                                 | A repetição final do primeiro evento é ignorada para seleção; compara-se somente sua primeira ocorrência com a do segundo. | Caracterizado e implementado. Uma possível melhoria futura exige decisão explícita.                                     |

### Normalização caracterizada para eventos

Na ordem observada, o algoritmo:

1. converte o texto para minúsculas;
2. substitui espaço não separável por espaço comum;
3. remove caracteres de controle equivalentes aos códigos ASCII de 0 a 31;
4. aplica somente os mapas `á à â ã ä -> a`, `é è ê ë -> e`, `í ì î ï -> i`, `ó ò ô õ ö -> o`, `ú ù û ü -> u` e `ç -> c`;
5. substitui caracteres fora de `a-z`, `0-9` e espaço por espaço;
6. colapsa espaços e aplica `trim`;
7. remove os artigos isolados `a`, `o`, `as`, `os`, `um` e `uma`;
8. normaliza novamente os espaços.

A busca é literal sobre o texto normalizado, sem fuzzy matching, sinônimos, limites de palavra, `lastIndexOf`, tokenização ou preferência pela chave mais longa. A posição explicativa é 1-based no texto normalizado e não corresponde a um índice no texto bruto.

### Limitações legadas caracterizadas

- As entradas longas de digitação e conferência também contêm as respectivas entradas curtas. A entrada curta começa mais à direita e, por isso, é selecionada.
- A repetição posterior do mesmo evento não atualiza sua posição, pois `SEARCH` encontra apenas a primeira ocorrência de cada chave.
- A remoção de controles pode concatenar palavras separadas diretamente por quebra de linha. `Digitação\nOK`, por exemplo, não corresponde a `Digitação OK`.
- O catálogo atual possui dez chaves normalizadas distintas, sem pares que possam começar na mesma posição. Essa invariância é protegida por teste. O desempate para uma futura chave coincidente ainda não está definido.

## Etapas operacionais

**Fonte da caracterização**: matriz da camada `Processamento` descrita pelo Mestre na Etapa 8 em 2026-09-26 e reproduzida em `packages/domain/src/operational-stages/determine-operational-stage.spec.ts`.

Evento e etapa são conceitos diferentes. A política recebe um `OperationalEvent` já reconhecido e não relê a observação. Os códigos estáveis da etapa e seus equivalentes conceituais no legado são:

| Código de etapa         | Equivalente conceitual no legado |
| ----------------------- | -------------------------------- |
| `CRITICAL_ANALYSIS`     | Análise Crítica                  |
| `PENDING`               | Pendência                        |
| `AWAITING_TYPING`       | Aguardando Digitação             |
| `TYPING`                | Digitação                        |
| `TYPING_ERROR`          | Erro na Digitação                |
| `TYPING_COMPLETED`      | Digitação OK                     |
| `AWAITING_MERCANTE`     | Aguardando Mercante              |
| `AWAITING_CCT`          | Aguardando CCT                   |
| `READY_FOR_REVIEW`      | Pronto para Conferência          |
| `IN_REVIEW`             | Em Conferência                   |
| `AWAITING_REGISTRATION` | Aguardando Registro              |
| `REVIEW_OBSERVATION`    | Revisar observação               |

Essas equivalências documentam o comportamento, mas não definem textos de interface.

| ID             | Condição caracterizada                                             | Etapa resultante        | Estado e limites                                                                                                 |
| -------------- | ------------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| RULE-STAGE-001 | `TYPING_COMPLETED`, modal marítimo e referência Mercante ausente.  | `AWAITING_MERCANTE`     | Caracterizado, não aprovado.                                                                                     |
| RULE-STAGE-002 | `TYPING_COMPLETED`, modal marítimo e referência Mercante presente. | `READY_FOR_REVIEW`      | Caracterizado, não aprovado. Presença não significa Mercante aberto ou conferido.                                |
| RULE-STAGE-003 | `TYPING_COMPLETED` e modal aéreo.                                  | `AWAITING_CCT`          | Caracterizado, não aprovado. A presença da referência Mercante não participa dessa decisão.                      |
| RULE-STAGE-004 | `PROCESS_REVIEWED`.                                                | `AWAITING_REGISTRATION` | Caracterizado, não aprovado.                                                                                     |
| RULE-STAGE-005 | `UNIDENTIFIED`.                                                    | `REVIEW_OBSERVATION`    | Caracterizado, não aprovado. É um estado explícito, não uma exceção técnica.                                     |
| RULE-STAGE-006 | `CRITICAL_ANALYSIS_STARTED`.                                       | `CRITICAL_ANALYSIS`     | Caracterizado, não aprovado.                                                                                     |
| RULE-STAGE-007 | `PENDING_ISSUE_REPORTED`.                                          | `PENDING`               | Caracterizado, não aprovado. Desvios não participam desta família de regras.                                     |
| RULE-STAGE-008 | `PENDING_ISSUES_RETURNED`.                                         | `AWAITING_TYPING`       | Caracterizado, não aprovado.                                                                                     |
| RULE-STAGE-009 | `PROCESS_SENT_TO_TYPING` ou `SENT_TO_TYPING`.                      | `TYPING`                | Caracterizado, não aprovado. Os eventos permanecem distintos apesar da mesma etapa.                              |
| RULE-STAGE-010 | `DUIMP_GENERATION_ERROR`.                                          | `TYPING_ERROR`          | Caracterizado, não aprovado.                                                                                     |
| RULE-STAGE-011 | `PROCESS_SENT_TO_REVIEW` ou `SENT_TO_REVIEW`.                      | `IN_REVIEW`             | Caracterizado, não aprovado. Os eventos permanecem distintos apesar da mesma etapa.                              |
| RULE-STAGE-012 | `TYPING_COMPLETED` e modal de domínio `other` ou `unknown`.        | `TYPING_COMPLETED`      | Caracterizado, não aprovado. Evento e etapa permanecem tipos distintos mesmo quando têm significado equivalente. |

Somente `TYPING_COMPLETED` consulta modal e presença da referência Mercante. Os demais mapeamentos dependem apenas do evento. A política não determina status detalhado do Mercante, CCT, prontidão adicional, alerta, criticidade ou desvio.

A precedência entre a etapa derivada e a coluna principal de alerta foi caracterizada na Etapa 11. A interação com documentos, sinais específicos de Mercante e outras dimensões continua aberta.

## Criticidade

**Fonte da caracterização**: ordem e limites da fórmula da camada `Processamento` descritos pelo Mestre na Etapa 9 em 2026-09-26 e reproduzidos em `packages/domain/src/operational-criticality/determine-operational-criticality.spec.ts`.

A expressão caracterizada é:

```text
se ETA estiver ausente:
  não classificada
senão, se chegada estiver presente:
  criticidade 4
senão, se ETA - data de avaliação <= 5:
  criticidade 3
senão, se ETA - data de avaliação <= 7:
  criticidade 2
senão:
  criticidade 1
```

| ID            | Condição caracterizada                                                     | Resultado                      | Estado e limites                                                                                     |
| ------------- | -------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| RULE-CRIT-001 | ETA existe e a chegada está presente.                                      | Criticidade `4`.               | Caracterizado, não aprovado. A data da chegada não é comparada.                                      |
| RULE-CRIT-002 | ETA existe, chegada está ausente e `ETA - avaliação <= 5`.                 | Criticidade `3`.               | Caracterizado, não aprovado. Inclui ETA hoje e qualquer ETA vencida, mesmo por mais de cinco dias.   |
| RULE-CRIT-003 | ETA existe, chegada está ausente e `5 < ETA - avaliação <= 7`.             | Criticidade `2`.               | Caracterizado, não aprovado. Os limites 5 e 7 são inclusivos nos respectivos ramos.                  |
| RULE-CRIT-004 | ETA existe, chegada está ausente e `ETA - avaliação > 7`.                  | Criticidade `1`.               | Caracterizado, não aprovado.                                                                         |
| RULE-CRIT-005 | ETA está ausente, com chegada presente ou ausente.                         | Criticidade não classificada.  | Caracterizado, não aprovado. A ausência de ETA precede a presença de chegada.                        |
| RULE-CRIT-006 | ETA e avaliação são datas civis válidas e a data de avaliação é explícita. | Usa dias corridos gregorianos. | Caracterizado, não aprovado. Horas, timezone, dias úteis e relógio global não participam da decisão. |

A diferença possui sinal e não recebe valor absoluto ou limite mínimo. Por isso, ETA vencida por um ou vinte dias continua no ramo matemático `<= 5` e recebe criticidade `3`. O alerta de ETA vencida permanece uma dimensão separada. Criticidade não define prioridade nem ordenação.

## Desvios

**Fonte da caracterização**: normalização, catálogo conhecido, precedência contextual e fallback da fórmula descritos pelo Mestre na Etapa 10 em 2026-09-26 e reproduzidos em `packages/domain/src/deviations/`.

Impacto e lifecycle são dimensões independentes de um desvio individual. Esta família não correlaciona fontes, não agrega desvios por processo, não produz contagens e não gera alertas.

### Lifecycle individual

| ID           | Fato válido recebido pelo Domain       | Resultado                                  | Estado e limites                                                                                                                                          |
| ------------ | -------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RULE-DEV-001 | Encerramento confirmadamente ausente.  | Lifecycle `OPEN`.                          | Caracterizado, não aprovado. A futura fronteira não pode converter `FIM` inválido em ausência.                                                            |
| RULE-DEV-002 | Desvio está `OPEN`.                    | Entra futuramente na contagem operacional. | Relatado, não implementado. A contagem e a correlação por processo permanecem fora desta família.                                                         |
| RULE-DEV-003 | Encerramento confirmadamente presente. | Lifecycle `CLOSED`.                        | Caracterizado, não aprovado. A exclusão de contagens abertas continua relatada; `CONCLUIDO_POR`, conteúdo da data e reabertura não participam da decisão. |

### Catálogo de impacto caracterizado

| Descrição configurada                                        | Impacto individual                                       |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `Problema no Mercante`                                       | `NON_BLOCKING`                                           |
| `Falta Packing List`                                         | `NON_BLOCKING`                                           |
| `Documentos originais não recebidos do Agente de Carga`      | `NON_BLOCKING`                                           |
| `Avarias antes do registro da DI`                            | `NON_BLOCKING`                                           |
| `Falta certificado de origem`                                | `NON_BLOCKING`                                           |
| `Fatura com Assinatura com cor diferente de azul (INV)`      | `NON_BLOCKING`                                           |
| `Divergência de peso entre fatura e Packing List`            | `BLOCKING`                                               |
| `Preço divergente`                                           | `BLOCKING`                                               |
| `Correção do B/L / AWB`                                      | `BLOCKING`                                               |
| `Falta recebimento de fatura com assinatura`                 | `BLOCKING` por padrão, sujeito à regra contextual abaixo |
| `Divergência de peso bruto entre HAWB/HBL e Invoice`         | `BLOCKING`                                               |
| `Divergência entre HAWB/BL e Faturas`                        | `BLOCKING`                                               |
| `Falta lançar linhas no eComex`                              | `BLOCKING`                                               |
| `Divergência na condição de pagamento entre fatura e pedido` | `BLOCKING`                                               |

Esse catálogo caracteriza somente as descrições já registradas no repositório. Sua completude ainda precisa ser validada contra a aba `Config`. A configuração operacional atual confirma exatamente `Fatura com Assinatura com cor diferente de azul (INV)` como `NON_BLOCKING`. A versão sem o sufixo não foi generalizada e, sem outra evidência, recebe o fallback legado para descrição desconhecida.

### Normalização caracterizada para impacto

Na ordem observada, a descrição, a observação e as descrições configuradas:

1. são convertidas para minúsculas;
2. têm caracteres de controle ASCII equivalentes a `CLEAN` removidos;
3. têm espaço não separável convertido para espaço comum;
4. perdem o prefixo inicial exato `Desvio:` quando presente;
5. aplicam os mapas de acentos portugueses e `ç -> c`;
6. substituem caracteres fora de `a-z`, `0-9` e espaço por espaço;
7. colapsam espaços e aplicam `trim`.

A comparação de descrição é igualdade entre valores normalizados. Não há fuzzy matching, sinônimos, stemming ou correção ortográfica. As chaves normalizadas do catálogo atual são únicas.

### Classificação contextual e fallbacks

| ID           | Condição caracterizada                                                                                                                 | Resultado                                   | Reason code                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| RULE-DEV-004 | Descrição útil corresponde a uma entrada do catálogo após normalização.                                                                | Impacto da entrada.                         | `IMPACT_FROM_EXPLICIT_CATALOG`              |
| RULE-DEV-005 | Descrição especial e observação corresponde, nesta ordem, a `nao veio`, `nao recebida` ou `nao enviada`, seguida de `pre alerta`.      | `BLOCKING`.                                 | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT`     |
| RULE-DEV-006 | Descrição especial sem contexto de pré-alerta e observação contém `fatura com assinatura`, `fatura assinada` ou `enviar ... assinada`. | `NON_BLOCKING`.                             | `SIGNED_INVOICE_NON_BLOCKING_CONTEXT`       |
| RULE-DEV-007 | A observação da descrição especial satisfaz as duas famílias contextuais.                                                              | `BLOCKING`.                                 | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT`     |
| RULE-DEV-008 | A descrição especial não possui padrão contextual reconhecido.                                                                         | `BLOCKING` pelo catálogo explícito.         | `IMPACT_FROM_EXPLICIT_CATALOG`              |
| RULE-DEV-009 | A descrição possui conteúdo útil, mas não corresponde ao catálogo.                                                                     | `BLOCKING` pelo fallback legado.            | `UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING` |
| RULE-DEV-010 | A descrição está ausente ou não possui conteúdo útil após normalização.                                                                | Impacto não classificado e issue explícita. | `MISSING_DEVIATION_DESCRIPTION`             |

A regra de pré-alerta é avaliada antes do contexto não impeditivo. O contexto especial só se aplica a `Falta recebimento de fatura com assinatura`; observações semelhantes não alteram outras descrições.

Princípio caracterizado: descrição de desvio não é necessariamente suficiente para determinar impacto operacional. O fallback impeditivo de descrição desconhecida reproduz o legado e ainda precisa de aprovação como regra futura.

## Pendência e desvios

| ID            | Condição relatada                                                            | Resultado operacional                                  | Estado                                       |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| RULE-PEND-001 | Etapa `Pendência` e existe ao menos um desvio impeditivo aberto.             | Processo bloqueado por desvio impeditivo.              | Relatado.                                    |
| RULE-PEND-002 | Etapa `Pendência`, sem impeditivos, mas com desvios não impeditivos abertos. | As pendências podem ser analisadas operacionalmente.   | Relatado. A ação seguinte não foi detalhada. |
| RULE-PEND-003 | Etapa `Pendência` e não existe qualquer desvio aberto.                       | Inconsistência e alerta `Pendência sem desvio aberto`. | Relatado.                                    |

## Alertas operacionais

**Fonte da caracterização**: ordem das condições da fórmula `IFS` da coluna de alerta principal descrita pelo Mestre na Etapa 11 em 2026-09-26 e reproduzida em `packages/domain/src/operational-alerts/determine-operational-alert.spec.ts`.

A política seleciona somente o primeiro alerta cuja condição é verdadeira. Ela não produz um conjunto de alertas simultâneos, não define severidade, não ordena o dashboard e não substitui etapa, criticidade, desvios ou dimensões documentais.

### Catálogo do alerta principal

| Código estável                     | Equivalente conceitual no legado                              |
| ---------------------------------- | ------------------------------------------------------------- |
| `UNIDENTIFIED_EVENT`               | Evento não identificado.                                      |
| `BLOCKING_DEVIATIONS_OPEN`         | Um ou mais desvios impeditivos abertos.                       |
| `ONLY_NON_BLOCKING_DEVIATIONS`     | Somente desvios não impeditivos; pode analisar as pendências. |
| `PENDING_WITHOUT_OPEN_DEVIATION`   | Inconsistência: pendência sem desvio aberto.                  |
| `TYPING_ERROR_REQUIRES_CORRECTION` | Corrigir erro ao gerar a DUIMP.                               |
| `ETA_OVERDUE_WITHOUT_ARRIVAL`      | ETA vencido e carga não chegada.                              |
| `PRIORITIZE_CRITICAL_ANALYSIS`     | Priorizar análise crítica.                                    |
| `PRIORITIZE_SEND_TO_TYPING`        | Priorizar envio para digitação.                               |
| `PRIORITIZE_TYPING`                | Priorizar digitação.                                          |
| `CRITICAL_ANALYSIS_IN_PROGRESS`    | Em análise crítica.                                           |
| `READY_TO_SEND_TO_TYPING`          | Pode encaminhar para digitação.                               |
| `TYPING_IN_PROGRESS`               | Processo em digitação.                                        |
| `NO_OPERATIONAL_ACTION`            | Sem ação operacional na coluna principal.                     |
| `READY_TO_SEND_TO_REVIEW`          | Pode enviar para conferência.                                 |
| `AWAITING_REVIEW_RETURN`           | Aguardando retorno da conferência.                            |
| `READY_TO_REGISTER`                | Pronto para registro.                                         |
| `AWAITING_CCT_OPENING`             | Aguardando abertura do CCT.                                   |

Essas equivalências documentam o legado e não são textos de interface definidos pelo Domain.

### Precedência caracterizada

| ID               | Ordem | Condição                                                         | Alerta principal                   | Reason code                                  |
| ---------------- | ----- | ---------------------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| `RULE-ALERT-001` | 1     | Etapa `REVIEW_OBSERVATION`.                                      | `UNIDENTIFIED_EVENT`               | `STAGE_REQUIRES_OBSERVATION_REVIEW`          |
| `RULE-ALERT-002` | 2     | Etapa `PENDING` e `blockingDeviationCount > 0`.                  | `BLOCKING_DEVIATIONS_OPEN`         | `PENDING_HAS_BLOCKING_DEVIATIONS`            |
| `RULE-ALERT-003` | 3     | Etapa `PENDING`, sem blocking e `nonBlockingDeviationCount > 0`. | `ONLY_NON_BLOCKING_DEVIATIONS`     | `PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS`   |
| `RULE-ALERT-004` | 4     | Etapa `PENDING`, sem desvios nas duas contagens.                 | `PENDING_WITHOUT_OPEN_DEVIATION`   | `PENDING_HAS_NO_OPEN_DEVIATIONS`             |
| `RULE-ALERT-005` | 5     | Etapa `TYPING_ERROR`.                                            | `TYPING_ERROR_REQUIRES_CORRECTION` | `TYPING_ERROR_PRESENT`                       |
| `RULE-ALERT-006` | 6     | ETA existe, `ETA - avaliação < 0` e chegada está ausente.        | `ETA_OVERDUE_WITHOUT_ARRIVAL`      | `ETA_IS_OVERDUE_WITHOUT_ARRIVAL`             |
| `RULE-ALERT-007` | 7     | `0 <= ETA - avaliação <= 5` e etapa `CRITICAL_ANALYSIS`.         | `PRIORITIZE_CRITICAL_ANALYSIS`     | `ETA_WITHIN_FIVE_DAYS_FOR_CRITICAL_ANALYSIS` |
| `RULE-ALERT-008` | 8     | A mesma janela futura e etapa `AWAITING_TYPING`.                 | `PRIORITIZE_SEND_TO_TYPING`        | `ETA_WITHIN_FIVE_DAYS_FOR_AWAITING_TYPING`   |
| `RULE-ALERT-009` | 9     | A mesma janela futura e etapa `TYPING`.                          | `PRIORITIZE_TYPING`                | `ETA_WITHIN_FIVE_DAYS_FOR_TYPING`            |
| `RULE-ALERT-010` | 10    | Etapa `CRITICAL_ANALYSIS` fora do ramo de prioridade.            | `CRITICAL_ANALYSIS_IN_PROGRESS`    | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-011` | 11    | Etapa `AWAITING_TYPING` fora do ramo de prioridade.              | `READY_TO_SEND_TO_TYPING`          | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-012` | 12    | Etapa `TYPING` fora do ramo de prioridade.                       | `TYPING_IN_PROGRESS`               | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-013` | 13    | Etapa `AWAITING_MERCANTE`.                                       | `NO_OPERATIONAL_ACTION`            | `NO_OPERATIONAL_ACTION_FOR_STAGE`            |
| `RULE-ALERT-014` | 14    | Etapa `READY_FOR_REVIEW`.                                        | `READY_TO_SEND_TO_REVIEW`          | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-015` | 15    | Etapa `IN_REVIEW`.                                               | `AWAITING_REVIEW_RETURN`           | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-016` | 16    | Etapa `AWAITING_REGISTRATION`.                                   | `READY_TO_REGISTER`                | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-017` | 17    | Etapa `AWAITING_CCT`.                                            | `AWAITING_CCT_OPENING`             | `ALERT_MAPPED_FROM_STAGE`                    |
| `RULE-ALERT-018` | 18    | Etapa `TYPING_COMPLETED`, único stage atual restante.            | `NO_OPERATIONAL_ACTION`            | `NO_OPERATIONAL_ACTION_FOR_STAGE`            |

As contagens recebidas representam desvios abertos com impacto já classificado. A política não recebe listas, não determina lifecycle, não classifica, não correlaciona e não conta desvios. Para stages diferentes de `PENDING`, as contagens não alteram o alerta.

A janela de prioridade futura usa dias corridos e exige diferença entre zero e cinco, inclusive. Ela não usa criticidade `3`, pois essa criticidade também inclui ETA vencida. As três condições de prioridade futura não consultam chegada; chegada presente não desativa a prioridade caracterizada. ETA ausente não produz overdue nem prioridade.

`NO_OPERATIONAL_ACTION` afirma somente que a coluna principal não indica ação. Ela não elimina possíveis sinais específicos de Mercante, CCT ou documentos.

## Mercante

Aplicável principalmente ao modal marítimo.

Situações relatadas:

- `Aguardando abertura`;
- `Mercante ausente com ETA próxima`;
- `Mercante aberto`;
- `Conferir Mercante`;
- `Mercante conferido`;
- `Pendência no Mercante`;
- `Aguardando BL digitalizado`;
- `Verificar Mercante`.

| ID            | Evidência ou condição relatada                           | Resultado                                                          | Estado e lacunas                                                    |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| RULE-MERC-001 | Observação contém `MERCANTE CONFERIDO COM BL E SISTEMA`. | Evidência de Mercante conferido.                                   | Relatado.                                                           |
| RULE-MERC-002 | Evidência posterior indica `PENDÊNCIA NO MERCANTE`.      | A pendência volta a ficar ativa.                                   | Relatado. “Posterior” ainda precisa de definição operacional exata. |
| RULE-MERC-003 | `Nº CE MERCANTE` existe.                                 | Mercante existente, mas não necessariamente conferido.             | Relatado.                                                           |
| RULE-MERC-004 | Existe pendência no Mercante.                            | Não deve ser tratada automaticamente como desvio impeditivo comum. | Relatado. A interação exata com bloqueios permanece aberta.         |

`RULE-STAGE-002` caracteriza que a presença da referência Mercante produz a etapa legada `READY_FOR_REVIEW`. Isso não afirma que o Mercante esteja aberto ou conferido, nem resolve quais condições a regra futura de prontidão deverá exigir.

## BL original digitalizado

**Fonte da caracterização**: catálogo textual, normalização, precedência por posição e matriz de status descritos pelo Mestre na Etapa 12 em 2026-09-27 e reproduzidos em `packages/domain/src/digital-original/`.

O BL original digitalizado é uma dimensão independente do original físico, do Mercante, da etapa e do alerta principal. A política não recebe registros eComex nem descobre o desvio relacionado. Ela recebe somente o fato já interpretado `hasOpenDigitalOriginalDeviation`, que deve representar presença ou ausência confirmada, sem converter desconhecimento técnico em `false`.

### Evidências e precedência textual

| Evidência estável | Texto caracterizado                                   |
| ----------------- | ----------------------------------------------------- |
| `RECEIVED`        | `Original digitalizado OK`                            |
| `RECEIVED`        | `Originais OK`                                        |
| `AWAITING`        | `Aguardando envio do BL original digitalizado`        |
| `UNIDENTIFIED`    | Nenhuma das três evidências foi reconhecida no texto. |

| ID               | Comportamento atual caracterizado                                                                                        | Resultado                                                                          | Estado e lacunas                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| RULE-DIGITAL-001 | `Original digitalizado OK` ou `Originais OK` é reconhecido após a normalização específica da família.                    | Evidência `RECEIVED`.                                                              | Caracterizado, não aprovado. O alcance de `Originais OK` sobre o original físico continua aberto. |
| RULE-DIGITAL-002 | `Aguardando envio do BL original digitalizado` é reconhecido após a mesma normalização.                                  | Evidência `AWAITING`.                                                              | Caracterizado, não aprovado.                                                                      |
| RULE-DIGITAL-003 | Para cada uma das três chaves, a última ocorrência é localizada; entre elas, vence a maior posição no texto normalizado. | A evidência textual posterior prevalece, inclusive quando uma evidência se repete. | Caracterizado, não aprovado. Não reutiliza a seleção pelas primeiras ocorrências de eventos.      |
| RULE-DIGITAL-004 | Modal marítimo, evidência `RECEIVED` e ausência de desvio aberto relacionado.                                            | Status `RECEIVED`.                                                                 | Caracterizado, não aprovado.                                                                      |
| RULE-DIGITAL-005 | Modal marítimo, evidência `AWAITING` e presença de desvio aberto relacionado.                                            | Status `AWAITING`.                                                                 | Caracterizado, não aprovado.                                                                      |
| RULE-DIGITAL-006 | Modal marítimo, evidência `AWAITING` e ausência de desvio aberto relacionado.                                            | Status e issue `PENDING_WITHOUT_OPEN_DEVIATION`.                                   | Caracterizado como inconsistência, não aprovado.                                                  |
| RULE-DIGITAL-007 | Modal marítimo, evidência `RECEIVED` e presença de desvio aberto relacionado.                                            | Status e issue `RECEIVED_WITH_OPEN_DEVIATION`.                                     | Caracterizado como inconsistência, não aprovado.                                                  |
| RULE-DIGITAL-008 | Modal marítimo sem evidência textual reconhecida, independentemente do fato de desvio recebido.                          | Status `UNIDENTIFIED`.                                                             | Caracterizado, não aprovado. O desvio isolado não cria evidência textual.                         |
| RULE-DIGITAL-009 | Modal aéreo ou modal de domínio `other`.                                                                                 | Status `NOT_APPLICABLE`, mesmo que a observação contenha uma das evidências.       | Caracterizado, não aprovado.                                                                      |
| RULE-DIGITAL-010 | Modal de domínio `unknown`.                                                                                              | Status `UNIDENTIFIED`, razão de aplicabilidade indeterminada e issue explícita.    | Caracterizado, não aprovado. O modal não é presumido marítimo.                                    |

### Normalização caracterizada

Na ordem aplicada, a observação e as três chaves:

1. são convertidas para minúsculas;
2. têm espaço não separável convertido para espaço comum;
3. têm caracteres de controle ASCII equivalentes a `CLEAN` removidos;
4. aplicam somente os mapas `á à â ã ä -> a`, `é è ê ë -> e`, `í ì î ï -> i`, `ó ò ô õ ö -> o`, `ú ù û ü -> u` e `ç -> c`;
5. substituem caracteres fora de `a-z`, `0-9` e espaço por espaço;
6. colapsam espaços e aplicam `trim`.

A busca é literal, sem fuzzy matching, sinônimos, remoção de artigos ou interpretação de delimitadores. A posição explicativa é 1-based no texto normalizado. Observação ausente, vazia, somente com espaços e preenchida sem evidência possuem razões distintas, mas todas produzem evidência `UNIDENTIFIED`.

## BL original físico

**Fonte da caracterização**: evidências, matriz, janela temporal e precedência da exceção descritas pelo Mestre na Etapa 13 em 2026-09-27 e reproduzidas em `packages/domain/src/physical-original/`.

O original físico é uma dimensão independente do BL digitalizado, Mercante, etapa e alerta principal. A política recebe fatos de domínio já interpretados e não conhece cabeçalhos, registros eTrack ou linhas eComex.

### Evidência física

| Evidência estável | Fonte caracterizada                                                           |
| ----------------- | ----------------------------------------------------------------------------- |
| `RECEIVED`        | Presença válida de `Datas Originais`.                                         |
| `RECEIVED`        | Observação contém literalmente `Originais OK` após a normalização da família. |
| `UNIDENTIFIED`    | A observação não contém a evidência textual caracterizada.                    |

| ID                | Comportamento ou limite                                                                        | Resultado                                                               | Estado e lacunas                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| RULE-PHYSICAL-001 | Presença válida de `Datas Originais`.                                                          | Evidência de recebimento físico.                                        | Caracterizado, não aprovado. A fronteira futura fornece apenas `hasOriginalReceiptDate`. |
| RULE-PHYSICAL-002 | A observação contém `Originais OK` após a normalização específica.                             | Evidência textual `RECEIVED`.                                           | Caracterizado, não aprovado.                                                             |
| RULE-PHYSICAL-003 | A observação contém somente `Original digitalizado OK` ou outro texto não catalogado.          | Evidência física `UNIDENTIFIED`.                                        | Caracterizado, não aprovado. O status digital não é usado como proxy.                    |
| RULE-PHYSICAL-004 | Modal `air` ou `maritime`, fora da heurística legado FEDEX.                                    | Dimensão aplicável.                                                     | Caracterizado, não aprovado.                                                             |
| RULE-PHYSICAL-005 | Modal `other` ou `unknown`.                                                                    | Aplicabilidade indeterminada, status `UNIDENTIFIED` e issue específico. | Representação conservadora; o resultado legado continua aberto.                          |
| RULE-PHYSICAL-006 | Modal `air`, House presente e Agente ausente.                                                  | `NOT_APPLICABLE` com `LEGACY_FEDEX_EXCEPTION_MATCHED`.                  | Caracterizado somente como heurística legado, não como identidade FEDEX.                 |
| RULE-PHYSICAL-007 | A heurística de `RULE-PHYSICAL-006` coincide com Datas Originais ou `Originais OK`.            | A exceção legado prevalece e permanece `NOT_APPLICABLE`.                | Caracterizado, não aprovado.                                                             |
| RULE-PHYSICAL-008 | Recebimento confirmado e ausência de desvio aberto relacionado.                                | `RECEIVED`.                                                             | Caracterizado, não aprovado.                                                             |
| RULE-PHYSICAL-009 | Recebimento confirmado e presença de desvio aberto relacionado.                                | `RECEIVED_WITH_OPEN_DEVIATION` e issue.                                 | Caracterizado como inconsistência, não aprovado.                                         |
| RULE-PHYSICAL-010 | Sem recebimento, ETA presente, `ETA - avaliação <= 7` e presença de desvio aberto relacionado. | `AWAITING`.                                                             | Caracterizado, não aprovado. Inclui qualquer diferença negativa.                         |
| RULE-PHYSICAL-011 | Sem recebimento, a mesma condição de limite superior e ausência de desvio aberto relacionado.  | `PENDING_WITHOUT_OPEN_DEVIATION` e issue.                               | Caracterizado como inconsistência, não aprovado. Inclui qualquer diferença negativa.     |
| RULE-PHYSICAL-012 | Recebimento confirmado com ETA ausente, vencida ou distante.                                   | O recebimento prevalece sobre a janela temporal.                        | Caracterizado, não aprovado.                                                             |
| RULE-PHYSICAL-013 | Sem recebimento e ETA ausente ou com diferença superior a sete dias.                           | `UNIDENTIFIED` com razão e issue específicos.                           | Preservação explícita de incerteza, não resultado legado caracterizado.                  |
| RULE-PHYSICAL-014 | `hasOpenPhysicalOriginalDeviation` é recebido pronto pela política.                            | A política não classifica, correlaciona, conta nem busca desvios.       | Limite arquitetural aprovado; produção do fato permanece aberta.                         |

### Normalização textual caracterizada

Na ordem aplicada, a observação e a chave `Originais OK`:

1. são convertidas para minúsculas;
2. têm espaço não separável convertido para espaço comum;
3. têm caracteres de controle ASCII equivalentes a `CLEAN` removidos;
4. aplicam somente os mapas `á à â ã ä -> a`, `é è ê ë -> e`, `í ì î ï -> i`, `ó ò ô õ ö -> o`, `ú ù û ü -> u` e `ç -> c`;
5. substituem caracteres fora de `a-z`, `0-9` e espaço por espaço;
6. colapsam espaços e aplicam `trim`.

A busca é literal, sem fuzzy matching, sinônimos ou inferência a partir do status digital. Observação ausente, vazia, somente com espaços e preenchida sem a evidência possuem razões distintas.

### Janela temporal

A janela caracterizada usa dias corridos gregorianos e possui somente limite superior: ETA deve existir e `ETA - avaliação <= 7`. Não existe limite inferior. Portanto, ETA hoje, futura em até sete dias e qualquer ETA vencida, inclusive por mais de sete dias, satisfazem a condição. Esse comportamento legado está caracterizado, mas não aprovado como regra futura. A política reutiliza `CivilDate`, recebe `evaluationDate` explicitamente e não consulta relógio global, criticidade ou alerta operacional.

Sem recebimento, os resultados da planilha para ETA ausente e diferença superior a sete dias ainda não foram fornecidos. O código usa `UNIDENTIFIED` e issues específicos para preservar a lacuna sem promover esse tratamento a comportamento legado caracterizado.

## Candidato FEDEX

| ID             | Padrão observado                                  | Uso relatado                                                                                   | Estado                                                                        |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| RULE-FEDEX-001 | Modal aéreo, `House` preenchido e `Agente` vazio. | No controle físico, produz exceção `NOT_APPLICABLE` antes das evidências de recebimento.       | Caracterizado somente como heurística legado. Não é identificação definitiva. |
| RULE-FEDEX-002 | Determinados casos FEDEX no pós-registro.         | Podem ser considerados aptos ao faturamento sem a mesma regra de original aplicada aos demais. | A validar. As condições exatas não foram fornecidas.                          |

## Prontidão e conferência

| ID             | Distinção relatada                                                                            | Consequência                                    |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| RULE-READY-001 | `Pronto para Conferência`, `Em Conferência` e `Aguardando Registro` são conceitos diferentes. | Não devem ser consolidados em um único estado.  |
| RULE-READY-002 | Processo marítimo possui `Digitação OK`, mas ainda depende do Mercante.                       | Pode permanecer sem prontidão para conferência. |
| RULE-READY-003 | Processo foi conferido.                                                                       | Pode estar `Aguardando Registro`.               |

Os predicados completos de prontidão e o efeito dos documentos e desvios ainda não foram fornecidos.

## Controle pós-registro

O controle separado considera, de forma relatada:

- processo com `Data Registro`;
- ausência de `Data do Faturamento`;
- modal aplicável.

Campos exibidos atualmente:

- Processo;
- Embarque;
- Data de Registro;
- Dias desde o registro;
- Data do Original;
- Nº BL;
- Agente;
- Status.

| ID            | Condição ou situação relatada                           | Resultado                                                    | Estado e lacunas                                              |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| RULE-POST-001 | Processo registrado, não faturado e de modal aplicável. | Entra no controle pós-registro.                              | Relatado. O conjunto de modais aplicáveis está aberto.        |
| RULE-POST-002 | Condições documentais permitem faturamento.             | `Pode faturar`.                                              | Relatado. Predicados completos ainda não fornecidos.          |
| RULE-POST-003 | Falta o original exigido.                               | `Falta BL Original`.                                         | Relatado. A fonte e precedência das evidências estão abertas. |
| RULE-POST-004 | Caso FEDEX elegível à exceção.                          | Pode faturar sem a mesma regra de original dos demais casos. | A validar.                                                    |

## Previsão de débitos

| ID             | Conhecimento atual                                                        | Estado                                                                      |
| -------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| RULE-DEBIT-001 | A previsão de débitos existe na ferramenta e faz parte do domínio futuro. | Identificada, sem detalhamento suficiente para regra ou cenário conclusivo. |

## Precedências conhecidas

Estas precedências são locais. Elas não formam uma ordem global de avaliação.

1. A presença de `Data Registro` retira o processo da fila operacional principal.
2. Entre eventos reconhecidos nas observações, o algoritmo legado seleciona a maior entre as primeiras posições normalizadas. Isso não comprova o último evento semântico nem determina a etapa.
3. Para BL digitalizado, prevalece a maior entre as últimas posições normalizadas das três evidências caracterizadas. A precedência do Mercante continua aberta.
4. Na etapa `Pendência`, desvios impeditivos abertos determinam bloqueio antes da análise dos não impeditivos.
5. Na etapa `Pendência`, ausência total de desvios abertos determina inconsistência.
6. Depois de `Digitação OK`, regras do modal podem substituir a etapa direta por uma espera específica ou prontidão.
7. Na criticidade, ETA ausente encerra a avaliação sem nível numérico; com ETA presente, chegada tem precedência sobre as faixas de diferença; sem chegada, aplicam-se em ordem os limites `<= 5`, `<= 7` e `> 7`.
8. No alerta principal, aplica-se integralmente a ordem 1 a 18 da seção `Alertas operacionais`; `REVIEW_OBSERVATION`, todos os ramos de `PENDING` e `TYPING_ERROR` precedem ETA vencida, que precede prioridades futuras e mapeamentos normais da etapa.

A seleção da coluna principal de alerta foi caracterizada. A ordem global entre essa saída, documentos, sinais específicos de Mercante, prioridades de dashboard e outras dimensões ainda precisa ser caracterizada.

## Princípios de modelagem aprovados

| ID             | Princípio                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RULE-MODEL-001 | Não existe um único campo global `status`.                                                                                                                                                               |
| RULE-MODEL-002 | `tracking`, `event`, `stage`, `criticality`, `deviations`, `alerts`, `mercante`, `digitalOriginal`, `physicalOriginal`, `readiness`, `inconsistencies` e `postRegistration` são dimensões independentes. |
| RULE-MODEL-003 | Uma dimensão pode estar conhecida enquanto outra permanece indefinida.                                                                                                                                   |
| RULE-MODEL-004 | `Não aplicável`, `Não identificado`, `Pendente`, `Desconhecido` e `Inconsistente` não devem ser escondidos por `null`.                                                                                   |
| RULE-MODEL-005 | Toda decisão futura deverá poder fornecer conceitualmente `value`, `reasonCodes`, `evidence` e `issues`.                                                                                                 |
| RULE-MODEL-006 | A integração normaliza dados técnicos; a interpretação operacional pertence ao domínio.                                                                                                                  |
| RULE-MODEL-007 | A implementação final dos tipos e funções permanece fora do escopo desta etapa.                                                                                                                          |
