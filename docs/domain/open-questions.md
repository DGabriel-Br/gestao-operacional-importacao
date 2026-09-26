# Questões de domínio em aberto

Estas questões devem ser respondidas com evidência da operação atual ou decisão humana explícita. Nenhuma resposta pode ser inferida silenciosamente.

## Identidade e correlação

| ID       | Questão                                                                   | Impacto da resposta                                      | Evidência necessária                                          |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| Q-ID-001 | Qual é a chave definitiva de correlação entre eTrack e eComex?            | Identidade, associação de desvios e persistência.        | Amostra anonimizada com casos normais, ausentes e duplicados. |
| Q-ID-002 | Qual é a cardinalidade entre processo, embarque, House, Master e Invoice? | Modelo do domínio e prevenção de associações incorretas. | Casos reais com relações 1:1, 1:N ou N:N.                     |
| Q-ID-003 | `Via Transporte` e `MODAL` representam sempre o mesmo conceito?           | Escolha da política marítima ou aérea.                   | Vocabulários das duas fontes e exemplos de divergência.       |
| Q-ID-004 | `Numero do Processo` é obrigatório, único, estável e nunca reutilizado?   | Identidade canônica do processo.                         | Histórico anonimizado e regra operacional da fonte.           |

## Importação e autoridade dos dados

| ID           | Questão                                                                                                                               | Impacto da resposta                                  | Evidência necessária                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Q-IMPORT-001 | Os arquivos representam snapshot completo ou atualização incremental?                                                                 | Reconciliação, remoções e idempotência.              | Procedimento operacional atual e arquivos sucessivos. |
| Q-IMPORT-002 | O que significa quando um registro desaparece em uma importação posterior?                                                            | Encerramento, exclusão ou preservação do processo.   | Exemplos históricos e orientação operacional.         |
| Q-IMPORT-003 | Qual fonte é autoritativa quando eTrack e eComex divergem?                                                                            | Resolução de conflitos.                              | Casos reais por campo e decisão humana.               |
| Q-IMPORT-004 | Qual é a precedência de ajustes manuais diante de novas importações?                                                                  | Preservação ou sobrescrita de correções.             | Fluxo atual de ajuste e responsabilidade operacional. |
| Q-IMPORT-005 | Um lote parcialmente inválido deve ser rejeitado ou processado parcialmente?                                                          | Atomicidade, rastreabilidade e recuperação de erros. | Decisão operacional sobre risco e correção.           |
| Q-IMPORT-006 | Quais são os formatos físicos dos arquivos, cabeçalhos, encoding e variações conhecidas?                                              | Futuro contrato de ingestão.                         | Exportações anonimizadas representativas.             |
| Q-IMPORT-007 | `INICIO`, `JUSTIFICATIVA`, `APONTADO_POR`, `CONCLUIDO_POR` e `EXPORT_NOME` participam de decisões ou apenas precisam ser preservados? | Limite entre fatos relevantes e metadados de origem. | Fórmulas atuais e uso operacional de cada campo.      |

## Acompanhamento, eventos e etapas

| ID         | Questão                                                                                                                                                               | Impacto da resposta                                                   | Evidência necessária                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Q-FLOW-001 | Resolvida para a família caracterizada na Etapa 6: identificador presente, registro ausente e ao menos ETA, transbordo reconhecido ou atracação marítima reconhecida. | Composição da fila principal implementada nesta etapa.                | Regras `RULE-TRACK-001` a `RULE-TRACK-007` e cenários `SCN-015` a `SCN-024`. |
| Q-FLOW-002 | Quais sinais sem ETA, além de atracação e transbordo, mantêm um processo na fila?                                                                                     | Cobertura de exceções.                                                | Catálogo atual de padrões.                                                   |
| Q-FLOW-003 | Qual é o conjunto completo de padrões de eventos nas observações?                                                                                                     | Identificação do último evento.                                       | Fórmulas, expressões e exemplos positivos e negativos.                       |
| Q-FLOW-004 | Quais artigos são removidos e qual é o algoritmo exato de normalização textual?                                                                                       | Equivalência com a planilha.                                          | Implementação atual e casos de borda.                                        |
| Q-FLOW-005 | “Último evento” significa última posição textual, maior data ou outra ordem?                                                                                          | Precedência entre eventos.                                            | Observações com múltiplos eventos e resultados atuais.                       |
| Q-FLOW-006 | Qual é o mapeamento completo de cada evento para etapa?                                                                                                               | Determinação da etapa operacional.                                    | Matriz da camada Processamento.                                              |
| Q-FLOW-007 | Qual é a precedência completa entre etapas normais e condições excepcionais?                                                                                          | Evitar resultados diferentes quando várias condições são verdadeiras. | Casos combinados e fórmula atual.                                            |
| Q-FLOW-008 | A etapa é sempre recalculada ou pode ser alterada manualmente?                                                                                                        | Histórico, reprocessamento e autoridade.                              | Fluxo operacional e exemplos de override.                                    |
| Q-FLOW-009 | Observação vazia tem o mesmo resultado de observação preenchida sem evento conhecido?                                                                                 | Estado `Evento não identificado` e inconsistências.                   | Resultado atual dos dois casos.                                              |
| Q-FLOW-010 | `Digitação OK` é simultaneamente evento e etapa na planilha ou são conceitos homônimos com critérios diferentes?                                                      | Evitar colapso entre evento e etapa.                                  | Casos em que cada valor aparece e fórmula de derivação.                      |
| Q-FLOW-011 | `Evento não identificado`, `Erro na Digitação` e `Desvio impeditivo aberto` pertencem a quais dimensões e podem coexistir com uma etapa?                              | Taxonomia do assessment e precedência.                                | Saídas atuais da camada Processamento em casos combinados.                   |
| Q-FLOW-012 | Como ETA, chegada ou registro inválidos, desconhecidos ou contraditórios devem ser convertidos para os fatos de presença usados na elegibilidade?                     | Evitar que erro técnico seja confundido com ausência.                 | Casos reais inválidos e decisão humana para a futura camada Application.     |
| Q-FLOW-013 | Qual é o resultado definitivo quando existe evidência de atracação, mas o modal não foi identificado?                                                                 | Aplicabilidade segura da exceção exclusivamente marítima.             | Casos da planilha com modal ausente ou desconhecido.                         |
| Q-FLOW-014 | Quais variações adicionais das frases de transbordo e atracação devem ser reconhecidas?                                                                               | Cobertura do reconhecedor sem fuzzy matching indevido.                | Exemplos positivos e negativos extraídos da planilha.                        |

## Datas, criticidade e prioridade

| ID         | Questão                                                                                               | Impacto da resposta                              | Evidência necessária                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| Q-DATE-001 | Qual fuso deve ser usado e qual é a semântica de datas sem horário?                                   | Reprodutibilidade de regras temporais.           | Convenção das fontes e operação.                                    |
| Q-DATE-002 | Quais regras usam dias corridos e quais usam dias úteis?                                              | Criticidade, pós-registro e previsão de débitos. | Fórmulas atuais e calendário operacional.                           |
| Q-DATE-003 | Qual criticidade é aplicada a ETA vencido sem chegada?                                                | Coerência entre criticidade e alerta.            | Resultado atual em diferentes atrasos.                              |
| Q-DATE-004 | Qual é a ordenação final da fila quando criticidade, etapa e alertas competem?                        | Prioridade operacional.                          | Ordenação atual e critérios de desempate.                           |
| Q-DATE-005 | A escala 1 a 4, seus limites inclusivos e o tratamento sem ETA devem ser preservados no novo sistema? | Aprovação da regra futura de criticidade.        | Comparação de casos de limite e decisão do responsável operacional. |

## Alertas

| ID          | Questão                                                           | Impacto da resposta                                     | Evidência necessária                                    |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Q-ALERT-001 | O catálogo de alertas fornecido está completo?                    | Cobertura da orientação operacional.                    | Configuração atual e exemplos de todos os alertas.      |
| Q-ALERT-002 | Qual é o gatilho e a condição de desativação de cada alerta?      | Evitar alertas persistentes ou ausentes incorretamente. | Fórmulas e cenários antes e depois da mudança de fatos. |
| Q-ALERT-003 | Alertas possuem severidade, ordem ou efeito direto na prioridade? | Ordenação da fila e apresentação.                       | Regras atuais do dashboard e da fila.                   |
| Q-ALERT-004 | Quais alertas podem coexistir no mesmo processo?                  | Composição do assessment sem status global.             | Casos atuais com múltiplos alertas.                     |

## Desvios

| ID        | Questão                                                                                                            | Impacto da resposta                                | Evidência necessária                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------- |
| Q-DEV-001 | Como desvios duplicados ou reabertos são identificados e contados?                                                 | Contagens e bloqueios.                             | Casos reais e regra atual.                            |
| Q-DEV-002 | Ausência de `FIM` é suficiente para abertura quando `CONCLUIDO_POR` está preenchido ou contraditório?              | Estado aberto e inconsistências.                   | Combinações reais dos campos.                         |
| Q-DEV-003 | Qual é o catálogo completo de descrições impeditivas e não impeditivas?                                            | Classificação do impacto.                          | Configuração atual e responsáveis por sua manutenção. |
| Q-DEV-004 | A correspondência de `DESCR_DESVIO` é literal, normalizada ou aproximada?                                          | Estabilidade da classificação.                     | Implementação atual e variações conhecidas.           |
| Q-DEV-005 | Quais conteúdos de `OBSERVACOES` tornam `Falta recebimento de fatura com assinatura` impeditiva ou não impeditiva? | Regra contextual crítica.                          | Casos positivos e negativos aprovados.                |
| Q-DEV-006 | O Controle de Desvios do MVP permitirá edição ou somente acompanhamento?                                           | Escopo do caso de uso e autoridade sobre o eComex. | Decisão humana.                                       |

## Mercante, CCT e documentos originais

| ID        | Questão                                                                                                                             | Impacto da resposta                              | Evidência necessária                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Q-DOC-001 | Para prontidão, Mercante precisa existir, estar aberto ou estar conferido?                                                          | Regra `Pronto para Conferência`.                 | Casos da planilha para cada situação.                          |
| Q-DOC-002 | Como pendência no Mercante altera etapa, prontidão e alertas?                                                                       | Fluxo marítimo.                                  | Observações ordenadas e resultados atuais.                     |
| Q-DOC-003 | Como a planilha determina a ordem entre evidências textuais conflitantes?                                                           | Mercante e BL digitalizado.                      | Estrutura real das observações e algoritmo atual.              |
| Q-DOC-004 | Quais evidências representam abertura e liberação do CCT?                                                                           | Saída de `Aguardando CCT`.                       | Casos aéreos reais.                                            |
| Q-DOC-005 | Quais descrições de desvio correspondem ao BL original digitalizado?                                                                | Situações com pendência ou desvio inconsistente. | Configuração e amostras do eComex.                             |
| Q-DOC-006 | Quais evidências e campos determinam o BL original físico?                                                                          | Pós-registro e faturamento.                      | Estrutura de `Datas Originais`, observações e desvios.         |
| Q-DOC-007 | `Originais OK` confirma apenas o digitalizado ou também o físico?                                                                   | Evitar propagação indevida de evidência.         | Casos atuais e significado operacional.                        |
| Q-DOC-008 | Quais são as expressões completas para `Pronto para Conferência`, `Em Conferência`, `Pronto para Registro` e `Aguardando Registro`? | Separação entre prontidão, execução e espera.    | Fórmulas atuais e casos com documentos e desvios concorrentes. |

## FEDEX

| ID          | Questão                                                                   | Impacto da resposta                    | Evidência necessária                             |
| ----------- | ------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| Q-FEDEX-001 | Qual é a regra definitiva de identificação FEDEX?                         | Aplicação segura das exceções.         | Casos positivos, negativos e fonte autoritativa. |
| Q-FEDEX-002 | Quais controles e regras são alterados para processos FEDEX?              | BL físico, pós-registro e faturamento. | Matriz atual de exceções.                        |
| Q-FEDEX-003 | Modal aéreo, `House` preenchido e `Agente` vazio possui falsos positivos? | Confiabilidade do padrão observado.    | Amostra real comparada com identificação humana. |

## Pós-registro e previsão de débitos

| ID          | Questão                                                                                 | Impacto da resposta                   | Evidência necessária                        |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| Q-POST-001  | Quais modais entram no controle pós-registro?                                           | Elegibilidade do controle.            | Fórmula atual e casos por modal.            |
| Q-POST-002  | Quais condições completas resultam em `Pode faturar` ou `Falta BL Original`?            | Situação de faturamento.              | Fórmulas e casos reais.                     |
| Q-POST-003  | Como correções em `Data Registro`, `Data do Faturamento` ou original afetam o controle? | Reprocessamento e histórico.          | Casos de correção.                          |
| Q-DEBIT-001 | Quais entradas, fórmulas, datas e saídas compõem a previsão de débitos?                 | Futuro detalhamento dessa capacidade. | Planilha, exemplos e validação operacional. |

## Dashboard

| ID         | Questão                                                                               | Impacto da resposta                   | Evidência necessária                                 |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Q-DASH-001 | Quais indicadores, agrupamentos, filtros e períodos compõem o dashboard atual?        | Escopo da projeção de leitura do MVP. | Inventário da aba Dashboard e exemplos anonimizados. |
| Q-DASH-002 | Com que frequência os indicadores são atualizados e qual data de referência utilizam? | Consistência com a fila operacional.  | Fluxo atual de atualização e fórmulas temporais.     |
| Q-DASH-003 | Cada indicador usa processos da fila principal, do pós-registro ou de ambos?          | Evitar contagens inconsistentes.      | Fórmulas e casos limítrofes.                         |

## Caracterização e aprovação

| ID         | Questão                                                                                         | Impacto da resposta                                   | Evidência necessária                        |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| Q-CHAR-001 | Quais casos reais podem ser anonimizados para os cenários documentados?                         | Evidência de equivalência com a planilha.             | Seleção do responsável operacional.         |
| Q-CHAR-002 | Quem aprova que um comportamento caracterizado deve ser preservado no novo sistema?             | Mudança de estado de `Caracterizado` para `Aprovado`. | Definição de responsabilidade.              |
| Q-CHAR-003 | Quais fórmulas, scripts e configurações da camada Processamento estão disponíveis para análise? | Cobertura do catálogo de regras.                      | Exportação controlada dos artefatos atuais. |

## Processo de resolução

Quando uma questão for respondida:

1. registrar a evidência no cenário relacionado;
2. atualizar o glossário, o dicionário ou o catálogo como fonte canônica;
3. manter a questão com estado resolvido e um link para a resposta;
4. não converter a resposta em ADR, salvo quando ela também representar uma decisão arquitetural durável.
