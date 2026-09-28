# Cenários de caracterização

Estes cenários são exemplos documentais anonimizados para confrontar o comportamento relatado com a planilha atual. As famílias caracterizadas nas Etapas 6 a 14 possuem testes executáveis no pacote de domínio.

Os resultados chamados de `Relatado` derivam do briefing operacional da Etapa 2 em 2026-09-26. Eles ainda precisam de evidência reproduzível da planilha e aprovação humana antes de orientar testes de domínio.

## Convenções

- `D0` representa a data de avaliação do cenário.
- Identificadores são fictícios.
- Quando um registro eTrack e um registro eComex aparecem juntos, o cenário assume apenas para caracterização que `Referencia Cliente` e `EMBARQUE` foram associados.
- `Resultado relatado` registra somente o comportamento fornecido nesta etapa.
- `Evidência necessária` indica o que deve ser obtido da planilha antes de aprovar a regra futura.

Salvo quando indicados como `Caracterizado`, os cenários continuam como rascunhos documentais e ainda não constituem evidência reproduzível da planilha.

Os cenários amplos da Etapa 2 permanecem como registro do relato original. Para a dimensão de etapa, as caracterizações da Etapa 8 substituem somente as seguintes parcelas:

| Cenário amplo | Caracterização canônica da etapa |
| ------------- | -------------------------------- |
| `SCN-001`     | `SCN-040`                        |
| `SCN-002`     | `SCN-041`                        |
| `SCN-003`     | `SCN-042`                        |
| `SCN-007`     | `SCN-047`                        |
| `SCN-009`     | `SCN-046`                        |

Alertas, integrações e demais afirmações desses cenários amplos continuam apenas relatados quando não possuem caracterização própria.

## SCN-001: Marítimo aguardando Mercante

**Regras relacionadas**: `RULE-STAGE-001`

**Dados relevantes**

- Processo: `PROCESS-001`.
- Embarque: `SHIPMENT-001`.
- Modal: marítimo.
- `Data Registro`: ausente.
- Observação contém evento reconhecido `Digitação OK`.
- `Nº CE MERCANTE`: ausente.

**Resultado relatado**

- Evento: `Digitação OK`.
- Etapa: `Aguardando Mercante`.

**Evidência necessária**

- Resultado da linha correspondente na camada Processamento.
- Confirmação de que ausência do número é condição suficiente.

## SCN-002: Marítimo com Mercante pronto para conferência

**Regras relacionadas**: `RULE-STAGE-002`, `RULE-MERC-005`

**Dados relevantes**

- Processo: `PROCESS-002`.
- Embarque: `SHIPMENT-002`.
- Modal: marítimo.
- `Data Registro`: ausente.
- Observação contém evento reconhecido `Digitação OK`.
- `Nº CE MERCANTE`: preenchido.

**Resultado relatado**

- Evento: `Digitação OK`.
- Etapa: `Pronto para Conferência`.

**Evidência necessária**

- Confirmar se Mercante existente basta ou se precisa estar aberto ou conferido.
- Verificar o efeito de uma evidência posterior de pendência no Mercante.

## SCN-003: Aéreo aguardando CCT

**Regras relacionadas**: `RULE-STAGE-003`

**Dados relevantes**

- Processo: `PROCESS-003`.
- Embarque: `SHIPMENT-003`.
- Modal: aéreo.
- `Data Registro`: ausente.
- Observação contém evento reconhecido `Digitação OK`.

**Resultado relatado**

- Evento: `Digitação OK`.
- Etapa: `Aguardando CCT`.
- Pode existir alerta `Aguardando abertura do CCT`.

**Evidência necessária**

- Identificar a evidência que representa CCT aberto.
- Confirmar quando a etapa deixa de ser `Aguardando CCT`.

## SCN-004: Pendência com desvio impeditivo aberto

**Regras relacionadas**: `RULE-DEV-001`, `RULE-PEND-001`

**Dados relevantes**

- Processo: `PROCESS-004`.
- Embarque: `SHIPMENT-004`.
- Etapa determinada pela planilha: `Pendência`.
- Desvio relacionado: `Preço divergente`.
- `FIM`: ausente.

**Resultado relatado**

- Um desvio impeditivo aberto.
- Processo bloqueado por desvio impeditivo.
- Alerta `Desvio impeditivo aberto`.

**Evidência necessária**

- Linha eComex anonimizada e resultado correspondente no Processamento.
- Confirmação do comportamento quando existem outros desvios simultâneos.

## SCN-005: Pendência apenas com desvio não impeditivo

**Regras relacionadas**: `RULE-DEV-001`, `RULE-PEND-002`

**Dados relevantes**

- Processo: `PROCESS-005`.
- Embarque: `SHIPMENT-005`.
- Etapa determinada pela planilha: `Pendência`.
- Desvio relacionado: `Falta Packing List`.
- `FIM`: ausente.
- Nenhum desvio impeditivo aberto.

**Resultado relatado**

- Um desvio não impeditivo aberto.
- Não existe bloqueio por desvio impeditivo.
- As pendências podem ser analisadas operacionalmente.

**Evidência necessária**

- Resultado da planilha e ação operacional apresentada ao usuário.

## SCN-006: Pendência sem desvio aberto

**Regras relacionadas**: `RULE-PEND-003`

**Dados relevantes**

- Processo: `PROCESS-006`.
- Embarque: `SHIPMENT-006`.
- Etapa determinada pela planilha: `Pendência`.
- Nenhum desvio relacionado sem `FIM`.

**Resultado relatado**

- Inconsistência `Pendência sem desvio aberto`.
- Alerta `Pendência sem desvio aberto`.

**Evidência necessária**

- Confirmar se desvios encerrados são exibidos como evidência secundária.
- Confirmar o impacto da inconsistência na fila.

## SCN-007: Evento não identificado

**Regras relacionadas**: `RULE-EVENT-003`, `RULE-STAGE-005`

**Dados relevantes**

- Processo: `PROCESS-007`.
- Embarque: `SHIPMENT-007`.
- `Data Registro`: ausente.
- Observação preenchida sem qualquer evento conhecido reconhecível.

**Resultado relatado**

- Evento: `Evento não identificado`.
- Etapa: `Revisar observação`.
- Alerta `Evento não identificado`.

**Evidência necessária**

- Exemplo anonimizado de observação real não reconhecida.
- Confirmação do comportamento para observação vazia.

## SCN-008: ETA vencido sem chegada

**Regras relacionadas**: alerta `ETA vencido e carga não chegada`, `RULE-CRIT-002`

**Dados relevantes**

- Processo: `PROCESS-008`.
- Embarque: `SHIPMENT-008`.
- `Data da Previsão de Chegada`: anterior a `D0`.
- `Data Chegada`: ausente.
- `Data Registro`: ausente.

**Resultado relatado**

- Alerta `ETA vencido e carga não chegada`.

**Caracterização posterior da criticidade**

- `SCN-060` e `SCN-061` substituem somente a parcela de criticidade deste cenário amplo: ETA vencida sem chegada recebe criticidade `3` pela condição matemática legada `ETA - avaliação <= 5`.
- O alerta e a prioridade continuam apenas relatados neste cenário.

**Evidência necessária**

- Resultado de criticidade e prioridade produzido atualmente pela planilha.

## SCN-009: Processo conferido aguardando registro

**Regras relacionadas**: `RULE-STAGE-004`, `RULE-READY-003`

**Dados relevantes**

- Processo: `PROCESS-009`.
- Embarque: `SHIPMENT-009`.
- `Data Registro`: ausente.
- Observação contém evento reconhecido `Processo conferido`.

**Resultado relatado**

- Evento: `Processo conferido`.
- Etapa: `Aguardando Registro`.

**Evidência necessária**

- Confirmar se desvios ou documentos podem impedir esse resultado mesmo após a conferência.

## SCN-010: BL original digitalizado pendente

**Regras relacionadas**: `RULE-DIGITAL-002`

**Dados relevantes**

- Processo: `PROCESS-010`.
- Embarque: `SHIPMENT-010`.
- Modal: marítimo.
- Observação contém `Aguardando envio do BL original digitalizado`.
- Não existe evidência posterior de recebimento.

**Resultado relatado**

- Situação: `Aguardando BL original digitalizado`.

**Caracterização posterior**

- `SCN-131` caracteriza `AWAITING` quando também existe desvio aberto relacionado.
- `SCN-132` caracteriza `PENDING_WITHOUT_OPEN_DEVIATION` quando a mesma evidência não possui o desvio aberto esperado.
- Este cenário amplo não informa o fato de desvio e, isoladamente, não determina qual dos dois status se aplica.

**Evidência necessária**

- Confirmar como desvios de documentos originais alteram o texto final da situação.

## SCN-011: BL original físico pendente

**Regras relacionadas**: `RULE-PHYSICAL-010`, `RULE-PHYSICAL-011`, `Q-DOC-013`

**Dados relevantes**

- Processo: `PROCESS-011`.
- Embarque: `SHIPMENT-011`.
- Modal: marítimo.
- `Datas Originais`: sem evidência de recebimento.
- Existe evidência operacional de aguardo do BL físico, cujo padrão textual real ainda será extraído da planilha.

**Resultado relatado a validar**

- Situação esperada na ferramenta atual: `Aguardando BL original físico`.

**Caracterização posterior**

- `SCN-160` caracteriza `AWAITING` quando ETA existe, sua diferença para a avaliação é `<= 7` e existe desvio aberto relacionado.
- `SCN-161` caracteriza `PENDING_WITHOUT_OPEN_DEVIATION` na mesma condição de limite superior sem o desvio esperado.
- Este cenário amplo não informa ETA nem o fato de desvio e, isoladamente, não determina qual status se aplica.

**Evidência necessária**

- Exemplo real anonimizado da evidência de aguardo.
- Precedência entre `Datas Originais`, observações e desvios.

## SCN-012: Candidato FEDEX no pós-registro

**Regras relacionadas**: `RULE-FEDEX-001`, `RULE-FEDEX-002`, `RULE-POST-004`

**Dados relevantes**

- Processo: `PROCESS-012`.
- Embarque: `SHIPMENT-012`.
- Modal: aéreo.
- `House`: preenchido.
- `Agente`: vazio.
- `Data Registro`: preenchida.
- `Data do Faturamento`: ausente.
- Não existe a mesma evidência de original exigida para os demais casos.

**Comportamento a validar**

- O padrão pode ser tratado como FEDEX em alguns controles.
- Em determinados casos, pode resultar em `Pode faturar`.

**Não afirmado neste cenário**

- Que o padrão identifica FEDEX de forma definitiva.
- Que todo candidato FEDEX está apto ao faturamento.

**Evidência necessária**

- Casos positivos e negativos da planilha.
- Confirmação humana da identificação e da exceção aplicável.

## SCN-013: Pendência posterior no Mercante

**Regras relacionadas**: `RULE-MERC-003`, `RULE-MERC-004`

**Dados relevantes**

- Processo: `PROCESS-013`.
- Embarque: `SHIPMENT-013`.
- Modal: marítimo.
- Observação contém primeiro `MERCANTE CONFERIDO COM BL E SISTEMA`.
- Evidência identificável posterior contém `PENDÊNCIA NO MERCANTE`.

**Resultado relatado**

- A pendência no Mercante volta a ficar ativa.
- Mercante não permanece simplesmente como conferido.

**Caracterização posterior**

- `SCN-174` caracteriza que a última ocorrência de `Pendência no Mercante` prevalece sobre a conferência anterior e produz `MercanteStatus.PENDING`.
- Cada chave usa sua última ocorrência normalizada antes da comparação entre pendência e conferência.

**Evidência necessária**

- Confirmar o efeito na etapa, prontidão e alertas.

## SCN-014: Evidências conflitantes de BL digitalizado

**Regras relacionadas**: `RULE-DIGITAL-001`, `RULE-DIGITAL-002`, `RULE-DIGITAL-003`

**Dados relevantes**

- Processo: `PROCESS-014`.
- Embarque: `SHIPMENT-014`.
- Modal: marítimo.
- A observação contém evidência de recebimento e evidência de pendência do BL digitalizado.

**Resultado relatado**

- A evidência mais recente identificável prevalece.

**Caracterização posterior**

- `SCN-138` a `SCN-142` caracterizam a ordem como a maior entre as últimas posições normalizadas das três chaves conhecidas.

**Variações necessárias**

1. `Original digitalizado OK` seguido de `Aguardando envio do BL original digitalizado`.
2. `Aguardando envio do BL original digitalizado` seguido de `Original digitalizado OK`.

**Evidência necessária**

- Aprovação humana de que a precedência caracterizada deve permanecer na regra futura.

## Acompanhamento operacional caracterizado na Etapa 6

A fonte da caracterização é a expressão da fórmula e seus padrões textuais legados descritos pelo Mestre na Etapa 6 em 2026-09-26. Os resultados abaixo são reproduzidos em `packages/domain/src/operational-monitoring/determine-monitoring-eligibility.spec.ts`. Eles ainda aguardam aprovação de negócio.

| Cenário   | Fatos relevantes                                                                                 | Resultado caracterizado                        | Razão principal                                |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| `SCN-015` | `PROCESS-015`, ETA presente, chegada ausente, registro ausente.                                  | Participa do acompanhamento.                   | `HAS_ETA`                                      |
| `SCN-016` | `PROCESS-016`, ETA e chegada presentes, registro ausente.                                        | Participa do acompanhamento.                   | `HAS_ETA`; chegada não encerra a participação. |
| `SCN-017` | `PROCESS-017`, ETA presente e registro presente.                                                 | Não participa do acompanhamento principal.     | `ALREADY_REGISTERED`                           |
| `SCN-018` | `PROCESS-018`, ETA ausente, registro ausente e nenhuma exceção textual reconhecida.              | Não participa do acompanhamento.               | `NO_TRACKING_TRIGGER`                          |
| `SCN-019` | `PROCESS-019`, ETA ausente, registro ausente e espera por confirmação de transbordo reconhecida. | Participa do acompanhamento.                   | `AWAITING_TRANSSHIPMENT_CONFIRMATION`          |
| `SCN-020` | `PROCESS-020`, modal marítimo, ETA ausente e espera por dados de atracação reconhecida.          | Participa do acompanhamento.                   | `AWAITING_BERTHING_DATA`                       |
| `SCN-021` | `PROCESS-021`, modal aéreo, ETA ausente e texto de espera por dados de atracação reconhecido.    | Não participa pela exceção exclusiva marítima. | `BERTHING_EVIDENCE_NOT_APPLICABLE`             |
| `SCN-022` | Identificador ausente, ETA presente e registro ausente.                                          | Não participa do acompanhamento.               | `MISSING_PROCESS_ID`                           |
| `SCN-023` | `PROCESS-023`, observação vazia, ETA ausente e registro ausente.                                 | Não participa do acompanhamento.               | `NO_TRACKING_TRIGGER`                          |
| `SCN-024` | `PROCESS-024`, registro presente e espera por confirmação de transbordo reconhecida.             | Não participa do acompanhamento principal.     | `ALREADY_REGISTERED`                           |

### Reconhecimento textual caracterizado

Os casos abaixo são reproduzidos em `packages/domain/src/operational-monitoring/recognize-observation-evidence.spec.ts`.

| Caso     | Observação anonimizada                                        | Evidência reconhecida                    |
| -------- | ------------------------------------------------------------- | ---------------------------------------- |
| Positivo | `AGDO CONFIRMAÇÃO DE TRANSBORDO DO AGENTE DE CARGA`           | Espera por confirmação de transbordo.    |
| Positivo | `Status: agdo., confirma o transbordo\ndo agente / de carga.` | Espera por confirmação de transbordo.    |
| Negativo | `AGENTE DE CARGA: AGDO CONFIRMA TRANSBORDO`                   | Nenhuma, pois a ordem não corresponde.   |
| Negativo | `AGDO CONFIRMA TRANSBORDO DO AGENTE`                          | Nenhuma, pois falta o fragmento `carga`. |
| Positivo | `Aguardando dados de atracação`                               | Espera por dados de atracação.           |
| Positivo | `AGUARDANDO... DADOS PARA ATRACAMENTO`                        | Espera por dados de atracação.           |
| Negativo | `Dados recebidos; aguardando atracação.`                      | Nenhuma, pois a ordem não corresponde.   |

Variações além dos fragmentos, da ordem e do ruído textual acima continuam não caracterizadas.

## Reconhecimento de evento operacional caracterizado na Etapa 7

A fonte da caracterização é o catálogo e a fórmula de reconhecimento da camada `Processamento` observados e descritos pelo Mestre na Etapa 7 em 2026-09-26. Os resultados são reproduzidos em `packages/domain/src/operational-events/recognize-operational-event.spec.ts` e ainda aguardam aprovação de negócio.

### Catálogo isolado e sobreposições

| Texto configurado                       | Evento selecionado pelo algoritmo legado | Observação                                                 |
| --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `Processo em análise crítica`           | `CRITICAL_ANALYSIS_STARTED`              | Correspondência isolada.                                   |
| `Pendência apontada`                    | `PENDING_ISSUE_REPORTED`                 | Correspondência isolada.                                   |
| `Recebemos retorno das pendências`      | `PENDING_ISSUES_RETURNED`                | Correspondência isolada.                                   |
| `Processo encaminhado para a digitação` | `SENT_TO_TYPING`                         | A chave curta começa mais à direita dentro da chave longa. |
| `Encaminhado para digitação`            | `SENT_TO_TYPING`                         | Correspondência isolada da chave curta.                    |
| `Erro ao gerar a DUIMP`                 | `DUIMP_GENERATION_ERROR`                 | Correspondência isolada.                                   |
| `Digitação OK`                          | `TYPING_COMPLETED`                       | Correspondência isolada.                                   |
| `Processo encaminhado para conferência` | `SENT_TO_REVIEW`                         | A chave curta começa mais à direita dentro da chave longa. |
| `Encaminhado para conferência`          | `SENT_TO_REVIEW`                         | Correspondência isolada da chave curta.                    |
| `Processo conferido`                    | `PROCESS_REVIEWED`                       | Correspondência isolada.                                   |

Os códigos `PROCESS_SENT_TO_TYPING` e `PROCESS_SENT_TO_REVIEW` continuam distintos no catálogo. Eles não são unidos às variantes curtas, embora não prevaleçam nos respectivos textos longos sob a seleção legada caracterizada.

### Cenários de seleção e normalização

| Cenário   | Observação ou condição                                                                 | Resultado caracterizado                                                                                                  |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `SCN-025` | Caixa, acentos, pontuação, múltiplos espaços ou artigos isolados diferem do catálogo.  | O evento corresponde após somente a normalização legada documentada.                                                     |
| `SCN-026` | Observação `undefined`, vazia, somente com espaços ou preenchida sem evento conhecido. | Evento `UNIDENTIFIED`; reason codes distinguem ausência, vazio, branco e texto sem correspondência.                      |
| `SCN-027` | `Processo em análise crítica // Digitação OK`.                                         | `TYPING_COMPLETED`, pois sua primeira correspondência está mais à direita.                                               |
| `SCN-028` | `Digitação OK // Processo em análise crítica`.                                         | `CRITICAL_ANALYSIS_STARTED`, pela inversão das primeiras posições.                                                       |
| `SCN-029` | `Digitação OK // Processo conferido // Digitação OK`.                                  | `PROCESS_REVIEWED`; a repetição final de `Digitação OK` não altera sua primeira posição.                                 |
| `SCN-030` | `Processo encaminhado para a digitação`.                                               | `SENT_TO_TYPING`, na posição normalizada 10; a variante longa também corresponde na posição 1.                           |
| `SCN-031` | `Processo encaminhado para conferência`.                                               | `SENT_TO_REVIEW`, na posição normalizada 10; a variante longa também corresponde na posição 1.                           |
| `SCN-032` | `Digitação\nOK`.                                                                       | `UNIDENTIFIED`, pois a remoção do controle concatena as palavras. `Digitação OK` com espaço não separável é reconhecido. |
| `SCN-033` | Vários eventos e fragmentos separados por `//`.                                        | Compara a primeira posição de cada chave e seleciona a maior, sem interpretar `//` como estrutura temporal.              |

Não há determinação de etapa nos cenários `SCN-025` a `SCN-033`.

## Determinação de etapa operacional caracterizada na Etapa 8

A fonte da caracterização é a matriz da camada `Processamento` descrita pelo Mestre na Etapa 8 em 2026-09-26. Os fatos abaixo já são conceitos de domínio: não representam diretamente os literais de modal do eTrack ou eComex. Os resultados são reproduzidos em `packages/domain/src/operational-stages/determine-operational-stage.spec.ts` e ainda aguardam aprovação de negócio.

| Cenário   | Evento e fatos adicionais                                          | Etapa caracterizada     | Reason code                                  |
| --------- | ------------------------------------------------------------------ | ----------------------- | -------------------------------------------- |
| `SCN-034` | `CRITICAL_ANALYSIS_STARTED`.                                       | `CRITICAL_ANALYSIS`     | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-035` | `PENDING_ISSUE_REPORTED`.                                          | `PENDING`               | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-036` | `PENDING_ISSUES_RETURNED`.                                         | `AWAITING_TYPING`       | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-037` | `PROCESS_SENT_TO_TYPING`.                                          | `TYPING`                | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-038` | `SENT_TO_TYPING`.                                                  | `TYPING`                | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-039` | `DUIMP_GENERATION_ERROR`.                                          | `TYPING_ERROR`          | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-040` | `TYPING_COMPLETED`, modal marítimo e referência Mercante ausente.  | `AWAITING_MERCANTE`     | `TYPING_COMPLETED_MARITIME_WITHOUT_MERCANTE` |
| `SCN-041` | `TYPING_COMPLETED`, modal marítimo e referência Mercante presente. | `READY_FOR_REVIEW`      | `TYPING_COMPLETED_MARITIME_WITH_MERCANTE`    |
| `SCN-042` | `TYPING_COMPLETED` e modal aéreo, com ou sem referência Mercante.  | `AWAITING_CCT`          | `TYPING_COMPLETED_AIR`                       |
| `SCN-043` | `TYPING_COMPLETED` e modal `other` ou `unknown`.                   | `TYPING_COMPLETED`      | `TYPING_COMPLETED_OTHER_MODE`                |
| `SCN-044` | `PROCESS_SENT_TO_REVIEW`.                                          | `IN_REVIEW`             | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-045` | `SENT_TO_REVIEW`.                                                  | `IN_REVIEW`             | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-046` | `PROCESS_REVIEWED`.                                                | `AWAITING_REGISTRATION` | `STAGE_MAPPED_FROM_EVENT`                    |
| `SCN-047` | `UNIDENTIFIED`.                                                    | `REVIEW_OBSERVATION`    | `UNIDENTIFIED_EVENT_REQUIRES_REVIEW`         |

### Independência dos fatos adicionais

`SCN-048` caracteriza que modal e referência Mercante não alteram a etapa de eventos diferentes de `TYPING_COMPLETED`. O contrato exige esses fatos somente no ramo especial, e os testes também exercitam entradas estruturais com contexto adicional para comprovar que ele é descartado da decisão.

Os cenários da Etapa 8 não reconhecem texto, não classificam desvios, não determinam alertas e não avaliam se o Mercante está aberto ou conferido. Em `SCN-041`, apenas a presença já interpretada da referência Mercante participa da reprodução do legado.

## Criticidade operacional caracterizada na Etapa 9

A fonte da caracterização é a ordem das condições e os limites da fórmula da camada `Processamento` descritos pelo Mestre na Etapa 9 em 2026-09-26. As entradas já são fatos válidos de domínio, sem parsing técnico ou horário. Os resultados são reproduzidos em `packages/domain/src/operational-criticality/determine-operational-criticality.spec.ts` e ainda aguardam aprovação de negócio.

| Cenário   | ETA em relação à avaliação ou condição adicional                                           | Chegada  | Resultado caracterizado                           | Reason code                                                             |
| --------- | ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `SCN-049` | ETA ausente.                                                                               | Ausente  | Não classificada.                                 | `MISSING_ETA`                                                           |
| `SCN-050` | ETA ausente.                                                                               | Presente | Não classificada.                                 | `MISSING_ETA`                                                           |
| `SCN-051` | ETA na data de avaliação.                                                                  | Presente | Criticidade `4`.                                  | `CARGO_ARRIVED`                                                         |
| `SCN-052` | ETA futura distante.                                                                       | Presente | Criticidade `4`.                                  | `CARGO_ARRIVED`                                                         |
| `SCN-053` | Diferença `0`.                                                                             | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-054` | Diferença `1`.                                                                             | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-055` | Diferença `5`.                                                                             | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-056` | Diferença `6`.                                                                             | Ausente  | Criticidade `2`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_SEVEN`                                      |
| `SCN-057` | Diferença `7`.                                                                             | Ausente  | Criticidade `2`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_SEVEN`                                      |
| `SCN-058` | Diferença `8`.                                                                             | Ausente  | Criticidade `1`.                                  | `ETA_DAY_DIFFERENCE_BEYOND_SEVEN`                                       |
| `SCN-059` | ETA futura distante, além de sete dias.                                                    | Ausente  | Criticidade `1`.                                  | `ETA_DAY_DIFFERENCE_BEYOND_SEVEN`                                       |
| `SCN-060` | Diferença `-1`, ETA ontem.                                                                 | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-061` | Diferença `-20`, ETA vinte dias vencida.                                                   | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-062` | De 25/02 a 02/03: diferença `6` em 2024 e 2000; diferença `5` em 2100, que não é bissexto. | Ausente  | Criticidade `2` nos anos bissextos e `3` em 2100. | `ETA_DAY_DIFFERENCE_AT_MOST_SEVEN` ou `ETA_DAY_DIFFERENCE_AT_MOST_FIVE` |
| `SCN-063` | Travessia de mês com diferença `6`.                                                        | Ausente  | Criticidade `2`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_SEVEN`                                      |
| `SCN-064` | Travessia de ano com diferença `6`.                                                        | Ausente  | Criticidade `2`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_SEVEN`                                      |
| `SCN-065` | Horários de origem distintos já projetados para a mesma data civil.                        | Ausente  | Criticidade `3`.                                  | `ETA_DAY_DIFFERENCE_AT_MOST_FIVE`                                       |
| `SCN-066` | ETA presente e chegada confirmada sem data de chegada no fato avaliado.                    | Presente | Criticidade `4`.                                  | `CARGO_ARRIVED`                                                         |

`SCN-050` caracteriza explicitamente que chegada sem ETA não produz criticidade `4`. `SCN-060` e `SCN-061` preservam a limitação legada para ETA vencida. `SCN-066` confirma que a política usa somente presença de chegada e não compara sua data.

Não há alerta, prioridade ou ordenação nos cenários `SCN-049` a `SCN-066`.

## Desvios individuais caracterizados na Etapa 10

A fonte da caracterização é a normalização, o catálogo conhecido, a precedência contextual e o fallback da fórmula descritos pelo Mestre na Etapa 10 em 2026-09-26. Os resultados são reproduzidos em `packages/domain/src/deviations/` e ainda aguardam aprovação de negócio. As entradas representam fatos válidos de domínio, sem tipos técnicos do eComex.

### Catálogo individual

| Cenário   | Descrição configurada                                                  | Impacto caracterizado | Reason code                    |
| --------- | ---------------------------------------------------------------------- | --------------------- | ------------------------------ |
| `SCN-067` | `Problema no Mercante`                                                 | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-068` | `Falta Packing List`                                                   | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-069` | `Documentos originais não recebidos do Agente de Carga`                | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-070` | `Avarias antes do registro da DI`                                      | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-071` | `Falta certificado de origem`                                          | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-072` | `Fatura com Assinatura com cor diferente de azul (INV)`                | `NON_BLOCKING`        | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-073` | `Divergência de peso entre fatura e Packing List`                      | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-074` | `Preço divergente`                                                     | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-075` | `Correção do B/L / AWB`                                                | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-076` | `Falta recebimento de fatura com assinatura`, sem contexto reconhecido | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-077` | `Divergência de peso bruto entre HAWB/HBL e Invoice`                   | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-078` | `Divergência entre HAWB/BL e Faturas`                                  | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-079` | `Falta lançar linhas no eComex`                                        | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |
| `SCN-080` | `Divergência na condição de pagamento entre fatura e pedido`           | `BLOCKING`            | `IMPACT_FROM_EXPLICIT_CATALOG` |

`SCN-081` caracteriza que prefixo inicial `Desvio:`, caixa, mapa de acentos, pontuação, espaços externos ou repetidos e NBSP não impedem a igualdade após a normalização legada. Um `Desvio:` no meio do texto não é removido. Controles ASCII são removidos conforme `CLEAN`; não há fuzzy matching.

`SCN-082` caracteriza descrição útil não encontrada no catálogo como `BLOCKING`, com `UNKNOWN_DESCRIPTION_DEFAULTED_TO_BLOCKING` e evidência explícita de fallback. `SCN-083` caracteriza `undefined`, string vazia, espaços, somente `Desvio:` ou somente pontuação como impacto não classificado, com `MISSING_DEVIATION_DESCRIPTION` e issue. Ausência não passa pelo fallback impeditivo.

### Fatura com assinatura

| Cenário   | Observação normalizada relevante                               | Impacto caracterizado        | Reason code                             |
| --------- | -------------------------------------------------------------- | ---------------------------- | --------------------------------------- |
| `SCN-084` | `nao veio ... pre alerta`                                      | `BLOCKING`                   | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT` |
| `SCN-085` | `nao recebida ... pre alerta`                                  | `BLOCKING`                   | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT` |
| `SCN-086` | `nao enviada ... pre alerta`                                   | `BLOCKING`                   | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT` |
| `SCN-087` | `fatura com assinatura`                                        | `NON_BLOCKING`               | `SIGNED_INVOICE_NON_BLOCKING_CONTEXT`   |
| `SCN-088` | `fatura assinada`                                              | `NON_BLOCKING`               | `SIGNED_INVOICE_NON_BLOCKING_CONTEXT`   |
| `SCN-089` | `enviar ... assinada`                                          | `NON_BLOCKING`               | `SIGNED_INVOICE_NON_BLOCKING_CONTEXT`   |
| `SCN-090` | Nenhum padrão contextual reconhecido.                          | `BLOCKING` pelo catálogo     | `IMPACT_FROM_EXPLICIT_CATALOG`          |
| `SCN-091` | Um padrão de pré-alerta e um padrão não impeditivo coexistem.  | `BLOCKING`                   | `SIGNED_INVOICE_MISSING_FROM_PRE_ALERT` |
| `SCN-092` | Fragmentos incompletos ou em ordem diferente.                  | `BLOCKING` pelo catálogo     | `IMPACT_FROM_EXPLICIT_CATALOG`          |
| `SCN-093` | Contexto de pré-alerta aparece com outra descrição catalogada. | Impacto próprio da descrição | `IMPACT_FROM_EXPLICIT_CATALOG`          |

`SCN-091` preserva a precedência legada: pré-alerta é avaliado antes do contexto não impeditivo. Os padrões contextuais só são consultados para `Falta recebimento de fatura com assinatura`.

### Lifecycle individual

| Cenário   | Fato de domínio | Lifecycle | Reason code                |
| --------- | --------------- | --------- | -------------------------- |
| `SCN-094` | `hasEnd: false` | `OPEN`    | `MISSING_END_MEANS_OPEN`   |
| `SCN-095` | `hasEnd: true`  | `CLOSED`  | `END_PRESENT_MEANS_CLOSED` |

`hasEnd` representa somente ausência ou presença já validada. `FIM` inválido não é convertido nesta família. Estar `OPEN` ou `CLOSED` não altera o impacto individual e não produz contagem ou alerta nesta etapa.

A aba `Config` confirma `Fatura com Assinatura com cor diferente de azul (INV)` como entrada explícita `NON_BLOCKING`. A versão sem `(INV)` não está catalogada e recebe `BLOCKING` pelo fallback de descrição desconhecida. Esse cenário protege contra generalização automática entre as variantes.

## Alerta operacional principal caracterizado na Etapa 11

A fonte da caracterização é a ordem completa da fórmula `IFS` da coluna principal de alerta descrita pelo Mestre na Etapa 11 em 2026-09-26. Os resultados são reproduzidos em `packages/domain/src/operational-alerts/determine-operational-alert.spec.ts` e ainda aguardam aprovação de negócio. Cada cenário retorna somente um alerta principal.

### Mapeamentos de etapa sem condição temporal concorrente

| Cenário   | Etapa                   | Alerta caracterizado               | Reason code                         |
| --------- | ----------------------- | ---------------------------------- | ----------------------------------- |
| `SCN-096` | `REVIEW_OBSERVATION`    | `UNIDENTIFIED_EVENT`               | `STAGE_REQUIRES_OBSERVATION_REVIEW` |
| `SCN-097` | `TYPING_ERROR`          | `TYPING_ERROR_REQUIRES_CORRECTION` | `TYPING_ERROR_PRESENT`              |
| `SCN-098` | `CRITICAL_ANALYSIS`     | `CRITICAL_ANALYSIS_IN_PROGRESS`    | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-099` | `AWAITING_TYPING`       | `READY_TO_SEND_TO_TYPING`          | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-100` | `TYPING`                | `TYPING_IN_PROGRESS`               | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-101` | `TYPING_COMPLETED`      | `NO_OPERATIONAL_ACTION`            | `NO_OPERATIONAL_ACTION_FOR_STAGE`   |
| `SCN-102` | `AWAITING_MERCANTE`     | `NO_OPERATIONAL_ACTION`            | `NO_OPERATIONAL_ACTION_FOR_STAGE`   |
| `SCN-103` | `READY_FOR_REVIEW`      | `READY_TO_SEND_TO_REVIEW`          | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-104` | `IN_REVIEW`             | `AWAITING_REVIEW_RETURN`           | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-105` | `AWAITING_REGISTRATION` | `READY_TO_REGISTER`                | `ALERT_MAPPED_FROM_STAGE`           |
| `SCN-106` | `AWAITING_CCT`          | `AWAITING_CCT_OPENING`             | `ALERT_MAPPED_FROM_STAGE`           |

`NO_OPERATIONAL_ACTION` descreve somente a coluna principal. `SCN-102` não caracteriza estado detalhado do Mercante, e `SCN-106` não caracteriza estado detalhado do CCT.

### Pendência e contagens prontas

| Cenário   | Contagens abertas recebidas  | Alerta caracterizado             | Reason code                                |
| --------- | ---------------------------- | -------------------------------- | ------------------------------------------ |
| `SCN-107` | 1 blocking, 0 non-blocking.  | `BLOCKING_DEVIATIONS_OPEN`       | `PENDING_HAS_BLOCKING_DEVIATIONS`          |
| `SCN-108` | 3 blocking e 4 non-blocking. | `BLOCKING_DEVIATIONS_OPEN`       | `PENDING_HAS_BLOCKING_DEVIATIONS`          |
| `SCN-109` | 0 blocking e 2 non-blocking. | `ONLY_NON_BLOCKING_DEVIATIONS`   | `PENDING_HAS_ONLY_NON_BLOCKING_DEVIATIONS` |
| `SCN-110` | 0 blocking e 0 non-blocking. | `PENDING_WITHOUT_OPEN_DEVIATION` | `PENDING_HAS_NO_OPEN_DEVIATIONS`           |

As quantidades permanecem em `evaluatedFacts`. O Domain não constrói frases com singular ou plural. As contagens já representam desvios abertos classificados; agregação, correlação, duplicidade e reabertura permanecem externas a esta política.

### Precedência sobre ETA vencida

Nos cenários seguintes, ETA é anterior à avaliação e chegada está ausente:

| Cenário   | Etapa e composição                   | Alerta que prevalece               |
| --------- | ------------------------------------ | ---------------------------------- |
| `SCN-111` | `REVIEW_OBSERVATION`.                | `UNIDENTIFIED_EVENT`               |
| `SCN-112` | `PENDING` com blocking.              | `BLOCKING_DEVIATIONS_OPEN`         |
| `SCN-113` | `PENDING` somente com non-blocking.  | `ONLY_NON_BLOCKING_DEVIATIONS`     |
| `SCN-114` | `PENDING` sem desvios nas contagens. | `PENDING_WITHOUT_OPEN_DEVIATION`   |
| `SCN-115` | `TYPING_ERROR`.                      | `TYPING_ERROR_REQUIRES_CORRECTION` |

`SCN-116` caracteriza que ETA vencida sem chegada substitui o mapeamento normal de `CRITICAL_ANALYSIS`, `AWAITING_TYPING`, `TYPING`, `AWAITING_MERCANTE`, `READY_FOR_REVIEW`, `IN_REVIEW`, `AWAITING_REGISTRATION`, `AWAITING_CCT` e `TYPING_COMPLETED` por `ETA_OVERDUE_WITHOUT_ARRIVAL`. `SCN-117` caracteriza que ETA vencida com chegada presente não produz esse alerta e deixa o mapeamento normal da etapa prevalecer.

### Janela futura de zero a cinco dias

| Cenário   | Etapa e diferença `ETA - avaliação`       | Chegada  | Alerta caracterizado                    |
| --------- | ----------------------------------------- | -------- | --------------------------------------- |
| `SCN-118` | `CRITICAL_ANALYSIS`, diferença 0.         | Ausente  | `PRIORITIZE_CRITICAL_ANALYSIS`          |
| `SCN-119` | `CRITICAL_ANALYSIS`, diferença 5.         | Ausente  | `PRIORITIZE_CRITICAL_ANALYSIS`          |
| `SCN-120` | `CRITICAL_ANALYSIS`, diferença 6.         | Ausente  | `CRITICAL_ANALYSIS_IN_PROGRESS`         |
| `SCN-121` | `AWAITING_TYPING`, diferenças 5 e 6.      | Ausente  | Prioriza em 5; mapeia normalmente em 6. |
| `SCN-122` | `TYPING`, diferenças 5 e 6.               | Ausente  | Prioriza em 5; mapeia normalmente em 6. |
| `SCN-123` | `CRITICAL_ANALYSIS`, diferença 5.         | Presente | `PRIORITIZE_CRITICAL_ANALYSIS`          |
| `SCN-124` | `AWAITING_MERCANTE`, diferença 0.         | Ausente  | `NO_OPERATIONAL_ACTION`                 |
| `SCN-125` | `CRITICAL_ANALYSIS`, diferença negativa.  | Ausente  | `ETA_OVERDUE_WITHOUT_ARRIVAL`           |
| `SCN-126` | ETA ausente nas três etapas priorizáveis. | Ausente  | Mapeamento normal da etapa.             |
| `SCN-127` | Diferença 5 atravessando mês ou ano.      | Ausente  | Aplica a prioridade da etapa.           |

`SCN-125` prova que criticidade `3` não é usada como atalho para a janela futura. Uma ETA vencida também pode ter criticidade `3`, mas pertence ao ramo anterior de overdue. `SCN-123` preserva que `hasArrival` não participa das três condições de prioridade futura.

`SCN-128` caracteriza que contagens blocking ou non-blocking maiores que zero não alteram o alerta de stages diferentes de `PENDING`.

Os cenários da Etapa 11 não classificam nem contam desvios, não determinam criticidade, não detalham Mercante, CCT ou BL e não ordenam o dashboard.

## BL original digitalizado caracterizado na Etapa 12

A fonte da caracterização é o catálogo textual, a normalização, a precedência por posição e a matriz de situações descritos pelo Mestre na Etapa 12 em 2026-09-27. Os resultados são reproduzidos em `packages/domain/src/digital-original/` e ainda aguardam aprovação de negócio.

### Matriz marítima de evidência e desvio relacionado

| Cenário   | Evidência textual reconhecida | Desvio aberto relacionado | Status caracterizado                     | Reason code                                       |
| --------- | ----------------------------- | ------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `SCN-129` | `Original digitalizado OK`.   | Não.                      | `RECEIVED`                               | `DIGITAL_ORIGINAL_RECEIVED`                       |
| `SCN-130` | `Originais OK`.               | Não.                      | `RECEIVED`                               | `DIGITAL_ORIGINAL_RECEIVED`                       |
| `SCN-131` | `AWAITING`.                   | Sim.                      | `AWAITING`                               | `DIGITAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION`   |
| `SCN-132` | `AWAITING`.                   | Não.                      | `PENDING_WITHOUT_OPEN_DEVIATION` e issue | `DIGITAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION` |
| `SCN-133` | `RECEIVED`.                   | Sim.                      | `RECEIVED_WITH_OPEN_DEVIATION` e issue   | `DIGITAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION`   |
| `SCN-134` | `UNIDENTIFIED`.               | Sim ou não.               | `UNIDENTIFIED`                           | `DIGITAL_ORIGINAL_EVIDENCE_NOT_IDENTIFIED`        |

`SCN-132` e `SCN-133` preservam as duas divergências como status e issue explícitos. `SCN-134` caracteriza que o desvio aberto isolado não é convertido em evidência textual de espera.

### Aplicabilidade por modal de domínio

| Cenário   | Modal     | Texto avaliado                      | Status caracterizado | Observação                                                                     |
| --------- | --------- | ----------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `SCN-135` | `air`     | Evidência `AWAITING` ou `RECEIVED`. | `NOT_APPLICABLE`     | A dimensão não representa a mesma exigência operacional no aéreo.              |
| `SCN-136` | `other`   | Evidência `AWAITING` ou `RECEIVED`. | `NOT_APPLICABLE`     | O modal está confirmado como não marítimo.                                     |
| `SCN-137` | `unknown` | Qualquer evidência ou nenhuma.      | `UNIDENTIFIED`       | A aplicabilidade permanece indeterminada e produz issue de modal desconhecido. |

Nenhum desses modais usa os literais do eTrack ou eComex. A futura camada de composição deverá fornecer o conceito de domínio já interpretado.

### Ordem textual das evidências

| Cenário   | Observação de entrada em ordem textual                                                                  | Evidência selecionada | Posição 1-based normalizada |
| --------- | ------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------- |
| `SCN-138` | `Aguardando envio do BL original digitalizado // Original digitalizado OK`.                             | `RECEIVED`            | 46                          |
| `SCN-139` | `Original digitalizado OK // Aguardando envio do BL original digitalizado`.                             | `AWAITING`            | 26                          |
| `SCN-140` | `Aguardando envio do BL original digitalizado // Originais OK`.                                         | `RECEIVED`            | Maior posição normalizada.  |
| `SCN-141` | `Originais OK // Aguardando envio do BL original digitalizado`.                                         | `AWAITING`            | Maior posição normalizada.  |
| `SCN-142` | `Original digitalizado OK // Aguardando envio do BL original digitalizado // Original digitalizado OK`. | `RECEIVED`            | 71                          |

Cada chave usa sua última ocorrência e vence a maior posição entre as três. `SCN-142` diferencia esta família do algoritmo de eventos, que usa somente a primeira ocorrência de cada chave.

### Normalização, ausência e limites

| Cenário   | Entrada ou variação                                                                                                    | Resultado caracterizado                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `SCN-143` | Caixa, mapa explícito de acentos, pontuação entre palavras, múltiplos espaços, NBSP ou texto adicional antes e depois. | A evidência corresponde após somente a normalização documentada em `RULE-DIGITAL`. |
| `SCN-144` | Observação `undefined`, vazia ou somente com espaços.                                                                  | Evidência `UNIDENTIFIED`, com reason code específico para cada condição.           |
| `SCN-145` | `Original digitalizado`, `Aguardando envio do BL original` ou as palavras de confirmação em ordem incorreta.           | Evidência `UNIDENTIFIED`; fragmentos incompletos não são generalizados.            |

Os cenários da Etapa 12 não determinam original físico, Mercante, correlação de fontes, classificação ou lifecycle de desvios. `hasOpenDigitalOriginalDeviation` é um fato pronto de presença ou ausência confirmada; sua produção e o tratamento de desconhecimento permanecem fora desta política.

## Original físico caracterizado na Etapa 13

A fonte da caracterização é a evidência física, a heurística legado, sua precedência e a janela temporal descritas pelo Mestre na Etapa 13 em 2026-09-27. Os resultados são reproduzidos em `packages/domain/src/physical-original/` e ainda aguardam aprovação de negócio.

### Evidência física independente do digital

| Cenário   | Entrada ou variação                                                                                     | Resultado da evidência física                            |
| --------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `SCN-146` | `Originais OK`.                                                                                         | `RECEIVED`.                                              |
| `SCN-147` | Caixa, mapa explícito de acentos, pontuação entre palavras, múltiplos espaços, NBSP ou texto adicional. | `RECEIVED` após somente a normalização documentada.      |
| `SCN-148` | Observação ausente, vazia ou somente com espaços.                                                       | `UNIDENTIFIED`, com razão específica para cada condição. |
| `SCN-149` | `Original digitalizado OK`, sem outra evidência física.                                                 | `UNIDENTIFIED`; o status digital não é proxy do físico.  |
| `SCN-150` | `Originais`, `OK Originais`, `Originais recebidos OK` ou sequência interrompida por controle ASCII.     | `UNIDENTIFIED`; não há fuzzy matching ou sinônimos.      |

`SCN-146` não funde as dimensões: `Originais OK` pode alimentar separadamente as políticas física e digital porque o legado usa a mesma frase nas duas. A decisão física nunca recebe `DigitalOriginalStatus`.

### Aplicabilidade e heurística legado

| Cenário   | Modal e fatos confirmados                              | Aplicabilidade ou status                               | Reason code                                    |
| --------- | ------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| `SCN-151` | `maritime`, com qualquer combinação de House e Agente. | `APPLICABLE`.                                          | `PHYSICAL_ORIGINAL_APPLICABLE`                 |
| `SCN-152` | `air`, House ausente e Agente ausente.                 | `APPLICABLE`; não presume FEDEX.                       | `PHYSICAL_ORIGINAL_APPLICABLE`                 |
| `SCN-153` | `air`, House presente e Agente presente.               | `APPLICABLE`; não presume FEDEX.                       | `PHYSICAL_ORIGINAL_APPLICABLE`                 |
| `SCN-154` | `air`, House presente e Agente ausente.                | `NOT_APPLICABLE`.                                      | `LEGACY_FEDEX_EXCEPTION_MATCHED`               |
| `SCN-155` | `other`.                                               | Aplicabilidade `UNDETERMINED` e status `UNIDENTIFIED`. | `PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED` |
| `SCN-156` | `unknown`.                                             | Aplicabilidade `UNDETERMINED` e status `UNIDENTIFIED`. | `PHYSICAL_ORIGINAL_APPLICABILITY_UNDETERMINED` |

A combinação de `SCN-154` é somente uma heurística legado. Ela não cria entidade FEDEX nem afirma a transportadora real. `other` e `unknown` possuem issues distintos, embora preservem o mesmo status indeterminado.

### Matriz de recebimento e desvio relacionado

| Cenário   | Evidência de recebimento                                    | Desvio aberto relacionado | Status caracterizado                      | Reason code                                        |
| --------- | ----------------------------------------------------------- | ------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `SCN-157` | Datas Originais presente.                                   | Não.                      | `RECEIVED`.                               | `PHYSICAL_ORIGINAL_RECEIVED`                       |
| `SCN-158` | `Originais OK`, sem Datas Originais.                        | Não.                      | `RECEIVED`.                               | `PHYSICAL_ORIGINAL_RECEIVED`                       |
| `SCN-159` | Datas Originais ou `Originais OK`.                          | Sim.                      | `RECEIVED_WITH_OPEN_DEVIATION` e issue.   | `PHYSICAL_ORIGINAL_RECEIVED_WITH_OPEN_DEVIATION`   |
| `SCN-160` | Nenhuma, ETA presente e diferença `ETA - avaliação <= 7`.   | Sim.                      | `AWAITING`.                               | `PHYSICAL_ORIGINAL_AWAITING_WITH_OPEN_DEVIATION`   |
| `SCN-161` | Nenhuma, a mesma condição de limite superior.               | Não.                      | `PENDING_WITHOUT_OPEN_DEVIATION` e issue. | `PHYSICAL_ORIGINAL_PENDING_WITHOUT_OPEN_DEVIATION` |
| `SCN-162` | Datas Originais ou `Originais OK` em processo aéreo normal. | Sim ou não.               | A mesma matriz de recebimento aplicável.  | Razão correspondente à presença do desvio.         |

`hasOpenPhysicalOriginalDeviation` chega pronto e representa presença ou ausência confirmada. Esses cenários não localizam, classificam, correlacionam ou contam desvios.

### Precedência da exceção e janela de sete dias

| Cenário   | Combinação                                                          | Resultado                                                                      |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `SCN-163` | Heurística legado de `SCN-154` e Datas Originais presente.          | `NOT_APPLICABLE`; a exceção precede o recebimento.                             |
| `SCN-164` | Heurística legado de `SCN-154` e `Originais OK`.                    | `NOT_APPLICABLE`; a exceção precede o recebimento.                             |
| `SCN-165` | Sem recebimento, ETA exatamente sete dias à frente e desvio aberto. | `AWAITING`, com diferença `7`.                                                 |
| `SCN-166` | A mesma diferença `7` atravessando mês ou ano.                      | `AWAITING`; usa dias civis gregorianos.                                        |
| `SCN-167` | Sem recebimento, ETA oito dias à frente, com ou sem desvio.         | `UNIDENTIFIED`, preservando resultado legado ainda não fornecido.              |
| `SCN-168` | Recebimento confirmado e ETA futura distante.                       | O recebimento prevalece e produz `RECEIVED` ou `RECEIVED_WITH_OPEN_DEVIATION`. |
| `SCN-169` | Sem recebimento e ETA vencida por 1 ou 20 dias.                     | Com desvio aberto, `AWAITING`; sem desvio, `PENDING_WITHOUT_OPEN_DEVIATION`.   |
| `SCN-170` | Sem recebimento e ETA ausente.                                      | `UNIDENTIFIED`, com issue de ETA ausente.                                      |

`SCN-169` preserva a peculiaridade da fórmula: a janela possui somente limite superior, então diferenças negativas continuam satisfazendo `<= 7`, sem reutilizar criticidade. `SCN-167` e `SCN-170` caracterizam a preservação explícita da incerteza no novo domínio, não um resultado da planilha. O resultado legado dessas duas combinações permanece em `Q-DOC-013`.

Os cenários da Etapa 13 não implementam Mercante, pós-registro, faturamento, correlação eTrack/eComex ou composição de `OperationalAssessment`.

## Mercante caracterizado na Etapa 14

A fonte da caracterização é a precedência textual, a existência operacional, a janela temporal e a projeção do BL digitalizado descritas pelo Mestre na Etapa 14 em 2026-09-28. Os resultados são reproduzidos em `packages/domain/src/mercante/` e ainda aguardam aprovação de negócio.

### Evidências textuais e precedência

| Cenário   | Observação ou condição                                                             | Resultado caracterizado                                                  |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `SCN-171` | `Pendência no Mercante`.                                                           | Evidência `PENDING` e status `PENDING`.                                  |
| `SCN-172` | `Mercante conferido com BL e sistema`.                                             | Evidência `CHECKED` e status `CHECKED`.                                  |
| `SCN-173` | Pendência seguida de conferência.                                                  | `CHECKED`, pois a última evidência definitiva está mais à direita.       |
| `SCN-174` | Conferência seguida de pendência.                                                  | `PENDING`, pela ordem textual inversa.                                   |
| `SCN-175` | Uma evidência definitiva aparece, a outra aparece e a primeira se repete ao final. | A repetição final prevalece porque cada chave usa sua última ocorrência. |
| `SCN-176` | `Mercante aberto`, sem referência CE.                                              | Evidência `EXISTS`; não significa `CHECKED`.                             |
| `SCN-177` | `Mercante disponível`, sem referência CE.                                          | Evidência `EXISTS`; não significa `CHECKED`.                             |
| `SCN-178` | `Mercante consultado`, sem referência CE.                                          | Evidência `EXISTS`; não significa `CHECKED`.                             |

Pendência e conferência são definitivas para esta dimensão. Uma evidência posterior apenas de existência não sobrescreve nenhuma delas.

### Aplicabilidade e existência

| Cenário   | Modal e fatos                                                            | Resultado caracterizado                               |
| --------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `SCN-179` | `maritime`, referência CE presente, BL disponível.                       | `READY_TO_CHECK`.                                     |
| `SCN-180` | `maritime`, referência CE presente, BL pendente.                         | `AWAITING_DIGITAL_ORIGINAL`.                          |
| `SCN-181` | `maritime`, referência CE presente, BL não identificado.                 | `VERIFY` com issue explícita.                         |
| `SCN-182` | `maritime`, somente referência CE presente.                              | Mercante existe, mas não recebe status `CHECKED`.     |
| `SCN-183` | `maritime`, somente `Mercante aberto`.                                   | Mercante existe, mas não recebe status `CHECKED`.     |
| `SCN-184` | `air`, com qualquer evidência de Mercante.                               | `NOT_APPLICABLE`.                                     |
| `SCN-185` | `other`, com qualquer evidência de Mercante.                             | `NOT_APPLICABLE`.                                     |
| `SCN-186` | `unknown`, com qualquer evidência.                                       | `UNIDENTIFIED`, aplicabilidade indeterminada e issue. |
| `SCN-187` | `maritime`, Mercante existente e `DigitalOriginalStatus.NOT_APPLICABLE`. | `VERIFY` com issue de combinação inconsistente.       |

A existência resulta de referência CE presente ou de uma evidência textual reconhecida. A política recebe `hasMercanteReference` pronto e não interpreta o cabeçalho externo.

### Janela temporal para Mercante ausente

| Cenário   | Diferença `ETA - avaliação` ou ausência | Status caracterizado         |
| --------- | --------------------------------------- | ---------------------------- |
| `SCN-188` | `0`, ETA hoje.                          | `MISSING_WITHIN_SEVEN_DAYS`. |
| `SCN-189` | `7`.                                    | `MISSING_WITHIN_SEVEN_DAYS`. |
| `SCN-190` | `8`.                                    | `AWAITING_OPENING`.          |
| `SCN-191` | `-1`, ETA ontem.                        | `MISSING_WITHIN_SEVEN_DAYS`. |
| `SCN-192` | `-20`, ETA vinte dias vencida.          | `MISSING_WITHIN_SEVEN_DAYS`. |
| `SCN-193` | ETA ausente.                            | `AWAITING_OPENING`.          |
| `SCN-194` | Diferença `7` atravessando mês ou ano.  | `MISSING_WITHIN_SEVEN_DAYS`. |

A janela usa diferença assinada e somente limite superior. Não consulta criticidade, original físico ou relógio global.

### Projeção do BL digitalizado e precedência final

| Cenário   | Mercante existente e status digital   | Projeção        | Status do Mercante           |
| --------- | ------------------------------------- | --------------- | ---------------------------- |
| `SCN-195` | `RECEIVED`.                           | Disponível.     | `READY_TO_CHECK`.            |
| `SCN-196` | `RECEIVED_WITH_OPEN_DEVIATION`.       | Disponível.     | `READY_TO_CHECK`.            |
| `SCN-197` | `AWAITING`.                           | Pendente.       | `AWAITING_DIGITAL_ORIGINAL`. |
| `SCN-198` | `PENDING_WITHOUT_OPEN_DEVIATION`.     | Pendente.       | `AWAITING_DIGITAL_ORIGINAL`. |
| `SCN-199` | `UNIDENTIFIED`.                       | Desconhecido.   | `VERIFY` com issue.          |
| `SCN-200` | `PENDING`, ETA vencida e BL recebido. | Não consultada. | `PENDING`.                   |
| `SCN-201` | `CHECKED`, ETA vencida e BL pendente. | Não consultada. | `CHECKED`.                   |

`SCN-196` preserva que a divergência do desvio continua na dimensão digital, mas não apaga a disponibilidade do documento. `SCN-198` preserva que a ausência do desvio não converte uma evidência de espera em recebimento.

### Normalização e limites

| Cenário   | Entrada ou variação                                                                                                  | Resultado caracterizado                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `SCN-202` | Caixa, mapa explícito de acentos, pontuação, múltiplos espaços, NBSP ou texto adicional.                             | Reconhece somente as cinco chaves após a normalização documentada.             |
| `SCN-203` | Observação ausente, vazia ou somente com espaços.                                                                    | Evidência `UNIDENTIFIED`, com razão específica para cada condição.             |
| `SCN-204` | Fragmentos incompletos como `Mercante conferido`, `Pendência Mercante` ou frases não catalogadas.                    | Evidência `UNIDENTIFIED`; não há fuzzy matching nem sinônimos.                 |
| `SCN-205` | Referência CE presente, sem evidência de conferência, combinada com etapa, alerta ou original físico não fornecidos. | A decisão usa somente seus fatos e não altera nenhuma dessas outras dimensões. |

Os cenários da Etapa 14 não implementam original físico, FEDEX, correlação entre fontes, desvios gerais, etapa, alerta principal, Application ou `OperationalAssessment`.

## Matriz mínima de cobertura

| Comportamento solicitado                       | Cenário                                      |
| ---------------------------------------------- | -------------------------------------------- |
| Marítimo aguardando Mercante                   | `SCN-001`                                    |
| Marítimo com Mercante pronto para conferência  | `SCN-002`                                    |
| Aéreo aguardando CCT                           | `SCN-003`                                    |
| Desvio impeditivo                              | `SCN-004`                                    |
| Apenas desvio não impeditivo                   | `SCN-005`                                    |
| Pendência sem desvio aberto                    | `SCN-006`                                    |
| Evento não identificado                        | `SCN-007`                                    |
| ETA vencido sem chegada                        | `SCN-008`                                    |
| Processo conferido aguardando registro         | `SCN-009`                                    |
| BL original digitalizado pendente              | `SCN-010`                                    |
| BL original físico pendente                    | `SCN-011`                                    |
| Exceção FEDEX a validar                        | `SCN-012`                                    |
| Pendência e conferência do Mercante            | `SCN-171` a `SCN-175`                        |
| Existência do Mercante sem conferência         | `SCN-176` a `SCN-183`                        |
| Aplicabilidade do Mercante por modal           | `SCN-184` a `SCN-187`                        |
| Janela temporal do Mercante ausente            | `SCN-188` a `SCN-194`                        |
| Disponibilidade digital aplicada ao Mercante   | `SCN-195` a `SCN-201`                        |
| Normalização e limites do Mercante             | `SCN-202` a `SCN-205`                        |
| Processo com ETA e sem registro                | `SCN-015`                                    |
| Processo com chegada que continua acompanhado  | `SCN-016`                                    |
| Processo registrado                            | `SCN-017`, `SCN-024`                         |
| Processo sem gatilho de acompanhamento         | `SCN-018`, `SCN-023`                         |
| Exceção de transbordo                          | `SCN-019`                                    |
| Exceção marítima de atracação                  | `SCN-020`, `SCN-021`                         |
| Processo sem identificador                     | `SCN-022`                                    |
| Normalização textual de evento                 | `SCN-025`                                    |
| Evento não identificado e estados de entrada   | `SCN-026`                                    |
| Eventos múltiplos em ordens opostas            | `SCN-027`, `SCN-028`                         |
| Repetição sob semântica de `SEARCH`            | `SCN-029`                                    |
| Sobreposição das variantes de digitação        | `SCN-030`                                    |
| Sobreposição das variantes de conferência      | `SCN-031`                                    |
| Controles e espaço não separável               | `SCN-032`                                    |
| Observação realista separada por `//`          | `SCN-033`                                    |
| Mapeamento direto de evento para etapa         | `SCN-034` a `SCN-039`, `SCN-044` a `SCN-047` |
| Digitação concluída por modal e Mercante       | `SCN-040` a `SCN-043`                        |
| Independência dos fatos adicionais             | `SCN-048`                                    |
| ETA ausente com e sem chegada                  | `SCN-049`, `SCN-050`                         |
| Chegada com ETA presente                       | `SCN-051`, `SCN-052`, `SCN-066`              |
| Limites numéricos da criticidade               | `SCN-053` a `SCN-059`                        |
| ETA vencida sem chegada                        | `SCN-060`, `SCN-061`                         |
| Calendário gregoriano e data civil             | `SCN-062` a `SCN-065`                        |
| Catálogo de impacto individual                 | `SCN-067` a `SCN-080`                        |
| Normalização, fallback e ausência de descrição | `SCN-081` a `SCN-083`                        |
| Contextos da fatura com assinatura             | `SCN-084` a `SCN-093`                        |
| Lifecycle `OPEN` e `CLOSED`                    | `SCN-094`, `SCN-095`                         |
| Mapeamento normal do alerta principal          | `SCN-096` a `SCN-106`                        |
| Alertas de pendência por contagens             | `SCN-107` a `SCN-110`                        |
| Precedência sobre ETA vencida                  | `SCN-111` a `SCN-117`                        |
| Janela futura e independência da criticidade   | `SCN-118` a `SCN-127`                        |
| Independência das contagens fora de pendência  | `SCN-128`                                    |
| Matriz marítima do BL digitalizado             | `SCN-129` a `SCN-134`                        |
| Aplicabilidade modal do BL digitalizado        | `SCN-135` a `SCN-137`                        |
| Ordem textual das evidências documentais       | `SCN-138` a `SCN-142`                        |
| Normalização e limites do BL digitalizado      | `SCN-143` a `SCN-145`                        |
| Evidência de original físico                   | `SCN-146` a `SCN-150`                        |
| Aplicabilidade e heurística legado física      | `SCN-151` a `SCN-156`                        |
| Matriz física de recebimento e desvio          | `SCN-157` a `SCN-162`                        |
| Precedência FEDEX e janela física de ETA       | `SCN-163` a `SCN-170`                        |
