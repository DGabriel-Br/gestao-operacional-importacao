# Glossário do domínio

Este glossário preserva o vocabulário operacional sem definir tipos de código. Os termos refletem o conhecimento disponível na Etapa 2.

As definições marcadas como `Relatado` derivam do briefing operacional de 2026-09-26 e ainda não foram confirmadas por artefatos da planilha.

## Conceitos centrais

| ID       | Termo preferido            | Definição atual                                                                                                                                                                     | Não confundir com                            | Estado   |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------- |
| TERM-001 | Processo de importação     | Unidade operacional identificada internamente pelo campo `Numero do Processo` do eTrack. Sua relação cardinal com embarque, House, Master e Invoice ainda não foi definida.         | Linha de arquivo ou embarque.                | Relatado |
| TERM-002 | Embarque                   | Referência operacional representada atualmente por `Referencia Cliente` no eTrack e `EMBARQUE` no eComex. Essa associação é comportamento observado, não chave definitiva aprovada. | Processo de importação.                      | Relatado |
| TERM-003 | Modal                      | Classificação de transporte relevante para regras marítimas e aéreas. As fontes usam `Via Transporte` e `MODAL`, cuja equivalência ainda precisa ser validada.                      | Texto bruto de uma coluna específica.        | Relatado |
| TERM-004 | ETA                        | Previsão de chegada usada no acompanhamento, na criticidade e em alertas. No eTrack corresponde a `Data da Previsão de Chegada`.                                                    | Data de chegada efetiva.                     | Relatado |
| TERM-005 | Chegada                    | Ocorrência efetiva de chegada da carga, representada por `Data Chegada` no eTrack.                                                                                                  | ETA.                                         | Relatado |
| TERM-006 | Registro                   | Registro do processo indicado por `Data Registro`. Um processo registrado deixa a fila operacional principal e pode entrar no controle pós-registro.                                | Pronto para registro ou aguardando registro. | Relatado |
| TERM-007 | Faturamento                | Fato de faturamento indicado por `Data do Faturamento` e situação operacional derivada no controle pós-registro.                                                                    | Registro.                                    | Relatado |
| TERM-008 | Acompanhamento operacional | Inclusão do processo na fila principal antes do registro, considerando ETA, chegada e sinais operacionais conhecidos.                                                               | Controle pós-registro.                       | Relatado |
| TERM-009 | Observação do processo     | Texto livre do eTrack usado como evidência para eventos e situações operacionais.                                                                                                   | `OBSERVACOES` de um desvio do eComex.        | Relatado |
| TERM-010 | Observação do desvio       | Texto associado a um desvio no eComex. Pode participar da determinação contextual de impacto.                                                                                       | `Observações` do processo no eTrack.         | Relatado |

## Decisões operacionais

| ID       | Termo preferido                          | Definição atual                                                                                                                                                                                      | Não confundir com                                        | Estado             |
| -------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------ |
| TERM-011 | Evento operacional                       | Código estável associado a um dos textos configurados que o algoritmo legado reconhece nas observações do processo.                                                                                  | Etapa operacional ou texto configurado.                  | Caracterizado      |
| TERM-012 | Evento selecionado pelo algoritmo legado | Evento cuja primeira correspondência normalizada começa mais à direita entre as primeiras correspondências das chaves conhecidas. Não representa necessariamente o último evento em ordem semântica. | Última ocorrência real, última linha ou evento por data. | Caracterizado      |
| TERM-013 | Etapa operacional                        | Resultado derivado do evento operacional e, para `TYPING_COMPLETED`, do modal e da presença da referência Mercante. Representa o ponto atual do fluxo sem formar um status global.                   | Evento, alerta ou prontidão detalhada.                   | Caracterizado      |
| TERM-014 | Criticidade                              | Classificação numérica atual de 1 a 4 derivada de ETA, presença de chegada e data civil de avaliação. Sem ETA, a dimensão permanece não classificada.                                                | Prioridade, alerta ou ordem da fila.                     | Caracterizado      |
| TERM-015 | Prioridade operacional                   | Indicação de urgência ou ação a tomar, expressa por alertas como `Priorizar digitação`. A ordenação completa da fila ainda não foi fornecida.                                                        | Criticidade.                                             | Relatado           |
| TERM-016 | Alerta operacional principal             | Único sinal selecionado pela primeira condição verdadeira da coluna legada de alerta. Orienta atenção ou ação sem substituir etapa, criticidade, desvios ou sinais específicos de documentos.        | Conjunto futuro de alertas, prioridade ou etapa.         | Caracterizado      |
| TERM-017 | Inconsistência operacional               | Combinação contraditória ou incompleta de evidências, como `Pendência sem desvio aberto`.                                                                                                            | Desvio registrado no eComex.                             | Relatado           |
| TERM-018 | Prontidão                                | Avaliação de que condições conhecidas permitem avançar para uma atividade, como conferência ou registro.                                                                                             | Atividade já em execução.                                | Relatado           |
| TERM-019 | OperationalAssessment                    | Composição conceitual de dimensões independentes como acompanhamento, evento, etapa, criticidade, desvios, alertas, documentos e pós-registro. Não representa um único status.                       | Implementação final de um tipo TypeScript.               | Princípio aprovado |

## Desvios

| ID       | Termo preferido       | Definição atual                                                                                                                                               | Não confundir com                     | Estado        |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------- |
| TERM-020 | Desvio                | Ocorrência operacional vinda do eComex e descrita por campos como `DESCR_DESVIO`, `INICIO`, `FIM` e observações.                                              | Descrição ou classificação do desvio. | Relatado      |
| TERM-021 | Descrição do desvio   | Texto interpretado pela política de impacto após normalização legada específica. Pode ser insuficiente sem o contexto da observação.                          | Impacto do desvio.                    | Caracterizado |
| TERM-022 | Desvio aberto         | Desvio cujo fato de encerramento está confirmadamente ausente. Recebe lifecycle `OPEN`; sua contagem por processo pertence a uma política posterior.          | Desvio impeditivo.                    | Caracterizado |
| TERM-023 | Impacto do desvio     | Classificação individual `BLOCKING` ou `NON_BLOCKING`, independente do lifecycle. Pode resultar do catálogo, de contexto ou do fallback legado.               | Estado aberto ou encerrado.           | Caracterizado |
| TERM-024 | Desvio impeditivo     | Desvio individual cujo impacto foi classificado como `BLOCKING`. Seu efeito agregado sobre um processo não é determinado nesta família.                       | Pendência no Mercante.                | Caracterizado |
| TERM-025 | Desvio não impeditivo | Desvio individual cujo impacto foi classificado como `NON_BLOCKING`. Isso não afirma que esteja aberto, encerrado ou associado a determinado processo.        | Desvio encerrado.                     | Caracterizado |
| TERM-042 | Desvio encerrado      | Desvio cujo fato de encerramento está confirmadamente presente. Recebe lifecycle `CLOSED`; conteúdo e validade técnica de `FIM` são tratados antes do Domain. | Desvio não impeditivo.                | Caracterizado |

## Documentos e controles modais

| ID       | Termo preferido          | Definição atual                                                                                                                                                                                       | Não confundir com                                       | Estado                                      |
| -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| TERM-026 | Mercante                 | Dimensão operacional principalmente marítima, apoiada pelo número CE Mercante e por evidências nas observações. Existência não significa conferência.                                                 | Desvio impeditivo comum.                                | Relatado                                    |
| TERM-027 | CCT                      | Dimensão operacional aérea que pode impedir o avanço após a digitação. Suas evidências e estados completos ainda não foram fornecidos.                                                                | Mercante.                                               | Relatado                                    |
| TERM-028 | BL original digitalizado | Dimensão marítima determinada pela evidência textual mais recente entre três padrões caracterizados e pela presença já interpretada de desvio aberto relacionado. Divergências permanecem explícitas. | BL original físico, Mercante ou alerta principal.       | Caracterizado                               |
| TERM-029 | BL original físico       | Dimensão aérea ou marítima determinada por evidência de recebimento, janela própria de ETA e presença já interpretada de desvio aberto relacionado. Incertezas e divergências permanecem explícitas.  | BL original digitalizado, Mercante ou alerta principal. | Caracterizado                               |
| TERM-030 | Candidato FEDEX          | Heurística legado que, no controle de original físico, trata modal aéreo, House presente e Agente ausente como exceção não aplicável. Não comprova a identidade da transportadora.                    | Identificação confirmada de transportador ou agente.    | Caracterizado somente para a exceção legado |
| TERM-031 | Controle pós-registro    | Acompanhamento separado de processos registrados e ainda não faturados.                                                                                                                               | Fila operacional principal.                             | Relatado                                    |
| TERM-032 | Previsão de débitos      | Funcionalidade atual reconhecida como parte futura do domínio, ainda sem regras detalhadas.                                                                                                           | Situação de faturamento.                                | Identificado                                |

## Explicabilidade e estados explícitos

| ID       | Termo preferido  | Intenção conceitual                                                                         | Estado             |
| -------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------ |
| TERM-033 | Valor da decisão | Resultado de uma dimensão operacional.                                                      | Princípio aprovado |
| TERM-034 | Código de razão  | Identificador estável da razão que sustentou uma decisão futura.                            | Princípio aprovado |
| TERM-035 | Evidência        | Fato ou trecho relevante que sustenta uma decisão.                                          | Princípio aprovado |
| TERM-036 | Issue            | Ausência, ambiguidade, conflito ou inconsistência que limita uma avaliação.                 | Princípio aprovado |
| TERM-037 | Não aplicável    | A dimensão não se aplica ao caso, como uma regra exclusivamente marítima em processo aéreo. | Princípio aprovado |
| TERM-038 | Não identificado | A avaliação foi tentada, mas nenhuma evidência reconhecida foi encontrada.                  | Princípio aprovado |
| TERM-039 | Pendente         | Existe uma condição conhecida ainda não satisfeita.                                         | Princípio aprovado |
| TERM-040 | Desconhecido     | Não há informação suficiente para afirmar um resultado.                                     | Princípio aprovado |
| TERM-041 | Inconsistente    | As evidências presentes entram em conflito ou violam uma combinação esperada.               | Princípio aprovado |

Os estados acima documentam distinções semânticas aprovadas. Seus nomes finais em código ainda não foram definidos.
