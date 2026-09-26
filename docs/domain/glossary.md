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
| TERM-013 | Etapa operacional                        | Resultado derivado que representa o ponto atual do fluxo, como `Pendência` ou `Aguardando Registro`.                                                                                                 | Evento, alerta ou status global.                         | Relatado           |
| TERM-014 | Criticidade                              | Nível numérico atual de 1 a 4 baseado principalmente em chegada e ETA.                                                                                                                               | Prioridade final da fila.                                | Relatado           |
| TERM-015 | Prioridade operacional                   | Indicação de urgência ou ação a tomar, expressa por alertas como `Priorizar digitação`. A ordenação completa da fila ainda não foi fornecida.                                                        | Criticidade.                                             | Relatado           |
| TERM-016 | Alerta operacional                       | Sinal derivado que orienta atenção ou ação, sem substituir as demais dimensões da avaliação.                                                                                                         | Desvio ou etapa.                                         | Relatado           |
| TERM-017 | Inconsistência operacional               | Combinação contraditória ou incompleta de evidências, como `Pendência sem desvio aberto`.                                                                                                            | Desvio registrado no eComex.                             | Relatado           |
| TERM-018 | Prontidão                                | Avaliação de que condições conhecidas permitem avançar para uma atividade, como conferência ou registro.                                                                                             | Atividade já em execução.                                | Relatado           |
| TERM-019 | OperationalAssessment                    | Composição conceitual de dimensões independentes como acompanhamento, evento, etapa, criticidade, desvios, alertas, documentos e pós-registro. Não representa um único status.                       | Implementação final de um tipo TypeScript.               | Princípio aprovado |

## Desvios

| ID       | Termo preferido       | Definição atual                                                                                                   | Não confundir com                     | Estado   |
| -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------- |
| TERM-020 | Desvio                | Ocorrência operacional vinda do eComex e descrita por campos como `DESCR_DESVIO`, `INICIO`, `FIM` e observações.  | Descrição ou classificação do desvio. | Relatado |
| TERM-021 | Descrição do desvio   | Texto `DESCR_DESVIO` do eComex. Pode ser insuficiente para determinar o impacto.                                  | Impacto do desvio.                    | Relatado |
| TERM-022 | Desvio aberto         | Desvio sem valor em `FIM` no comportamento atual relatado. Apenas desvios abertos entram na contagem operacional. | Desvio impeditivo.                    | Relatado |
| TERM-023 | Impacto do desvio     | Classificação operacional `Impeditivo` ou `Não impeditivo`. Pode depender da descrição e de contexto adicional.   | Estado aberto ou encerrado.           | Relatado |
| TERM-024 | Desvio impeditivo     | Desvio aberto cujo impacto bloqueia o avanço operacional conforme as regras atuais.                               | Pendência no Mercante.                | Relatado |
| TERM-025 | Desvio não impeditivo | Desvio aberto que não bloqueia automaticamente o avanço operacional.                                              | Desvio encerrado.                     | Relatado |

## Documentos e controles modais

| ID       | Termo preferido          | Definição atual                                                                                                                                           | Não confundir com                                    | Estado       |
| -------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| TERM-026 | Mercante                 | Dimensão operacional principalmente marítima, apoiada pelo número CE Mercante e por evidências nas observações. Existência não significa conferência.     | Desvio impeditivo comum.                             | Relatado     |
| TERM-027 | CCT                      | Dimensão operacional aérea que pode impedir o avanço após a digitação. Suas evidências e estados completos ainda não foram fornecidos.                    | Mercante.                                            | Relatado     |
| TERM-028 | BL original digitalizado | Situação do documento original em formato digital, inferida por evidências textuais e desvios relacionados.                                               | BL original físico.                                  | Relatado     |
| TERM-029 | BL original físico       | Situação física do documento original, apoiada por `Datas Originais`, observações e desvios relacionados.                                                 | BL original digitalizado.                            | Relatado     |
| TERM-030 | Candidato FEDEX          | Padrão observado em alguns controles quando o modal é aéreo, `House` está preenchido e `Agente` está vazio. A identificação definitiva não está aprovada. | Identificação confirmada de transportador ou agente. | A validar    |
| TERM-031 | Controle pós-registro    | Acompanhamento separado de processos registrados e ainda não faturados.                                                                                   | Fila operacional principal.                          | Relatado     |
| TERM-032 | Previsão de débitos      | Funcionalidade atual reconhecida como parte futura do domínio, ainda sem regras detalhadas.                                                               | Situação de faturamento.                             | Identificado |

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
