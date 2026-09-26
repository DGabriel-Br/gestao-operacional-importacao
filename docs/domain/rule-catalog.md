# Catálogo de regras e comportamentos observados

Este catálogo descreve o comportamento atual relatado da ferramenta. Ele não é uma implementação, não define tipos finais e não aprova automaticamente cada comportamento como requisito futuro.

Os comportamentos marcados como `Relatado` foram fornecidos no briefing operacional da Etapa 2 em 2026-09-26. Nenhum artefato da planilha foi inspecionado para confirmá-los.

## Como interpretar o catálogo

- `Relatado` significa que o comportamento foi fornecido pela operação, mas ainda não foi comprovado por artefatos da planilha neste repositório.
- `A validar` indica conflito, lacuna ou condição incompleta.
- `Princípio aprovado` representa uma restrição de modelagem já aprovada, não uma regra operacional da planilha.
- Toda regra futura deverá ser ligada a cenários caracterizados antes de ser implementada.

## Acompanhamento operacional

| ID             | Comportamento atual relatado                                                                  | Resultado                                      | Estado e lacunas                                                                  |
| -------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| RULE-TRACK-001 | Processo sem `Data Registro` e com previsão de chegada.                                       | Permanece na fila operacional principal.       | Relatado. A expressão booleana completa ainda precisa ser extraída da planilha.   |
| RULE-TRACK-002 | Processo marítimo sem ETA, mas com observação indicando espera por dados de atracação.        | Pode permanecer na fila operacional principal. | Relatado. Padrões textuais exatos e demais condições precisam ser caracterizados. |
| RULE-TRACK-003 | Processo marítimo sem ETA, mas com observação indicando espera por confirmação de transbordo. | Pode permanecer na fila operacional principal. | Relatado. Padrões textuais exatos e demais condições precisam ser caracterizados. |
| RULE-TRACK-004 | Processo já chegou e ainda não possui `Data Registro`.                                        | Continua no acompanhamento.                    | Relatado.                                                                         |
| RULE-TRACK-005 | Processo possui `Data Registro`.                                                              | Deixa a fila operacional principal.            | Relatado. Pode passar ao controle pós-registro se cumprir os critérios próprios.  |

## Eventos operacionais

Os eventos conhecidos atualmente são:

- `Processo em análise crítica`;
- `Pendência apontada`;
- `Recebemos retorno das pendências`;
- `Processo encaminhado para a digitação`;
- `Encaminhado para digitação`;
- `Erro ao gerar a DUIMP`;
- `Digitação OK`;
- `Processo encaminhado para conferência`;
- `Encaminhado para conferência`;
- `Processo conferido`.

| ID             | Comportamento atual relatado                                                                                                 | Resultado                                                                  | Estado e lacunas                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| RULE-EVENT-001 | A observação é comparada com padrões conhecidos após normalização de caixa, acentuação, pontuação, espaços e alguns artigos. | Eventos reconhecíveis podem ser identificados mesmo sem igualdade literal. | Relatado. O algoritmo e a lista de artigos ainda não foram fornecidos.                  |
| RULE-EVENT-002 | Mais de um evento conhecido aparece nas observações.                                                                         | O último evento reconhecido é usado como base para a etapa atual.          | Relatado. “Último” pode significar ordem textual ou temporal e precisa ser validado.    |
| RULE-EVENT-003 | Nenhum evento conhecido é identificado.                                                                                      | Evento `Evento não identificado` e etapa `Revisar observação`.             | Relatado.                                                                               |
| RULE-EVENT-004 | Um evento é identificado.                                                                                                    | O evento participa da determinação da etapa, mas não é a própria etapa.    | Relatado e aprovado como distinção conceitual. O mapeamento completo ainda está aberto. |

## Etapas operacionais

Etapas relatadas:

- `Análise Crítica`;
- `Pendência`;
- `Aguardando Digitação`;
- `Digitação`;
- `Erro na Digitação`;
- `Digitação OK`;
- `Aguardando Mercante`;
- `Aguardando CCT`;
- `Pronto para Conferência`;
- `Em Conferência`;
- `Aguardando Registro`;
- `Revisar observação`.

Mapeamentos explicitamente fornecidos:

| ID             | Condição relatada                                           | Etapa resultante           | Estado e lacunas                                                                  |
| -------------- | ----------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| RULE-STAGE-001 | Evento `Digitação OK`, modal marítimo e Mercante ausente.   | `Aguardando Mercante`.     | Relatado.                                                                         |
| RULE-STAGE-002 | Evento `Digitação OK`, modal marítimo e Mercante existente. | `Pronto para Conferência`. | Relatado, mas requer validação com a distinção entre Mercante aberto e conferido. |
| RULE-STAGE-003 | Evento `Digitação OK` e modal aéreo.                        | `Aguardando CCT`.          | Relatado. A condição que encerra essa espera ainda não foi fornecida.             |
| RULE-STAGE-004 | Evento `Processo conferido`.                                | `Aguardando Registro`.     | Relatado.                                                                         |
| RULE-STAGE-005 | Nenhum evento conhecido.                                    | `Revisar observação`.      | Relatado.                                                                         |

O mapeamento dos demais eventos para etapas e a precedência completa entre condições normais e excepcionais permanecem abertos.

## Criticidade

A regra atual usa a data corrente e dias corridos.

| ID            | Condição relatada                  | Criticidade                                               | Estado e lacunas                                                          |
| ------------- | ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| RULE-CRIT-001 | Carga já chegou.                   | `4`                                                       | Relatado.                                                                 |
| RULE-CRIT-002 | ETA em até 5 dias.                 | `3`                                                       | Relatado. O tratamento de ETA vencido sem chegada precisa ser confirmado. |
| RULE-CRIT-003 | ETA superior a 5 e até 7 dias.     | `2`                                                       | Relatado. Limites são inclusivos conforme a descrição fornecida.          |
| RULE-CRIT-004 | ETA superior a 7 dias.             | `1`                                                       | Relatado.                                                                 |
| RULE-CRIT-005 | Processo sem ETA.                  | Pode não possuir criticidade numérica.                    | Relatado. O uso de um estado explícito ainda precisa ser aprovado.        |
| RULE-CRIT-006 | Avaliação temporal da criticidade. | Usa data corrente e dias corridos no comportamento atual. | Relatado. Não estabelece a regra futura definitiva.                       |

## Desvios

### Abertura e contagem

| ID           | Comportamento atual relatado            | Resultado                                            | Estado e lacunas                                                                         |
| ------------ | --------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| RULE-DEV-001 | `FIM` está ausente.                     | O desvio é considerado aberto.                       | Relatado. Combinações com `CONCLUIDO_POR`, reabertura e valores inválidos estão abertas. |
| RULE-DEV-002 | Desvio está aberto.                     | Entra na contagem operacional.                       | Relatado.                                                                                |
| RULE-DEV-003 | Desvio possui `FIM`.                    | Não entra na contagem de desvios abertos.            | Relatado.                                                                                |
| RULE-DEV-004 | Descrição e contexto estão disponíveis. | O impacto pode ser `Impeditivo` ou `Não impeditivo`. | Relatado. O catálogo completo e o tratamento de duplicidade estão abertos.               |

### Exemplos atualmente não impeditivos

- `Problema no Mercante`;
- `Falta Packing List`;
- `Documentos originais não recebidos do Agente de Carga`;
- `Avarias antes do registro da DI`;
- `Falta certificado de origem`;
- `Fatura com Assinatura com cor diferente de azul`.

### Exemplos atualmente impeditivos

- `Divergência de peso entre fatura e Packing List`;
- `Preço divergente`;
- `Correção do B/L / AWB`;
- `Divergência de peso bruto entre HAWB/HBL e Invoice`;
- `Divergência entre HAWB/BL e Faturas`;
- `Falta lançar linhas no eComex`;
- `Divergência na condição de pagamento entre fatura e pedido`.

As listas acima são exemplos relatados. Não são catálogos completos nem definem correspondência literal, normalizada ou aproximada.

### Classificação contextual

| ID           | Condição relatada                                             | Resultado                                                 | Estado e lacunas                                                     |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| RULE-DEV-005 | Descrição `Falta recebimento de fatura com assinatura`.       | O impacto não pode ser determinado apenas pela descrição. | Relatado.                                                            |
| RULE-DEV-006 | A mesma descrição possui contexto diferente em `OBSERVACOES`. | Pode ser impeditiva ou não impeditiva.                    | Relatado. Os padrões contextuais exatos precisam ser caracterizados. |

Princípio catalogado: descrição de desvio não é necessariamente suficiente para determinar impacto operacional.

## Pendência e desvios

| ID            | Condição relatada                                                            | Resultado operacional                                  | Estado                                       |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| RULE-PEND-001 | Etapa `Pendência` e existe ao menos um desvio impeditivo aberto.             | Processo bloqueado por desvio impeditivo.              | Relatado.                                    |
| RULE-PEND-002 | Etapa `Pendência`, sem impeditivos, mas com desvios não impeditivos abertos. | As pendências podem ser analisadas operacionalmente.   | Relatado. A ação seguinte não foi detalhada. |
| RULE-PEND-003 | Etapa `Pendência` e não existe qualquer desvio aberto.                       | Inconsistência e alerta `Pendência sem desvio aberto`. | Relatado.                                    |

## Alertas operacionais

| Alerta relatado                     | Condição conhecida nesta etapa                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Evento não identificado`           | Nenhum evento conhecido foi identificado.                                                                     |
| `Erro na Digitação`                 | O alerta existe, mas seu gatilho e sua relação com `Erro ao gerar a DUIMP` ainda precisam ser caracterizados. |
| `Pendência sem desvio aberto`       | Etapa Pendência sem desvio aberto.                                                                            |
| `Desvio impeditivo aberto`          | Existe ao menos um desvio impeditivo aberto.                                                                  |
| `ETA vencido e carga não chegada`   | ETA anterior à data de avaliação e `Data Chegada` ausente. A relação com criticidade precisa ser validada.    |
| `Priorizar análise crítica`         | Gatilho ainda não detalhado.                                                                                  |
| `Priorizar envio para digitação`    | Gatilho ainda não detalhado.                                                                                  |
| `Priorizar digitação`               | Gatilho ainda não detalhado.                                                                                  |
| `Pode encaminhar para digitação`    | Gatilho ainda não detalhado.                                                                                  |
| `Processo em digitação`             | Gatilho ainda não detalhado.                                                                                  |
| `Pode enviar para conferência`      | Gatilho ainda não detalhado.                                                                                  |
| `Aguardando retorno da conferência` | Gatilho ainda não detalhado.                                                                                  |
| `Pronto para registro`              | Gatilho ainda não detalhado.                                                                                  |
| `Aguardando abertura do CCT`        | Associado ao fluxo aéreo, com condição exata ainda não detalhada.                                             |

Alertas e etapas podem coexistir. A lista não define severidade nem ordenação da fila.

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

Existe uma lacuna entre `RULE-STAGE-002`, que usa Mercante existente para indicar prontidão, e a distinção entre Mercante existente e conferido. Essa lacuna deve ser resolvida por evidência da planilha.

## BL original digitalizado

Aplicável principalmente ao modal marítimo.

| ID               | Evidência relatada                                              | Resultado                                                                  | Estado e lacunas                                                   |
| ---------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| RULE-DIGITAL-001 | `Original digitalizado OK` ou `Originais OK`.                   | Evidência de recebimento.                                                  | Relatado. O escopo exato de `Originais OK` precisa ser confirmado. |
| RULE-DIGITAL-002 | `Aguardando envio do BL original digitalizado`.                 | Evidência de pendência.                                                    | Relatado.                                                          |
| RULE-DIGITAL-003 | Evidências de recebimento e pendência entram em conflito.       | Prevalece atualmente a evidência mais recente identificável na observação. | Relatado. A definição de ordem precisa ser caracterizada.          |
| RULE-DIGITAL-004 | Evidência documental e desvio aberto relacionado não concordam. | Pode resultar em situação inconsistente.                                   | Relatado, sem mapeamento completo entre descrições e situações.    |

Situações relatadas:

- `BL original digitalizado recebido`;
- `Aguardando BL original digitalizado`;
- `BL original digitalizado pendente sem desvio`;
- `BL original digitalizado recebido, mas desvio continua aberto`;
- `Status não identificado`.

## BL original físico

Aplicável principalmente ao modal marítimo e usa `Datas Originais`, observações e desvios correspondentes.

Situações relatadas:

- `BL original físico recebido`;
- `Aguardando BL original físico`;
- `BL original físico pendente sem desvio`;
- `BL original físico recebido, mas desvio continua aberto`.

| ID                | Comportamento atual relatado                                                            | Estado e lacunas                                                          |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| RULE-PHYSICAL-001 | `Datas Originais`, observações e desvios participam da determinação da situação física. | Relatado. A precedência e os padrões exatos não foram fornecidos.         |
| RULE-PHYSICAL-002 | Certos processos tratados como FEDEX podem receber comportamento especial.              | Relatado. A identificação e a exceção definitivas precisam ser validadas. |

## Candidato FEDEX

| ID             | Padrão observado                                  | Uso relatado                                                                                   | Estado                                               |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| RULE-FEDEX-001 | Modal aéreo, `House` preenchido e `Agente` vazio. | O padrão é tratado como FEDEX em alguns controles.                                             | A validar. Não é identificação definitiva.           |
| RULE-FEDEX-002 | Determinados casos FEDEX no pós-registro.         | Podem ser considerados aptos ao faturamento sem a mesma regra de original aplicada aos demais. | A validar. As condições exatas não foram fornecidas. |

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
2. Entre eventos reconhecidos nas observações, o último reconhecido é usado como base para a etapa.
3. Em evidências conflitantes de Mercante e BL digitalizado, a evidência mais recente identificável pode prevalecer.
4. Na etapa `Pendência`, desvios impeditivos abertos determinam bloqueio antes da análise dos não impeditivos.
5. Na etapa `Pendência`, ausência total de desvios abertos determina inconsistência.
6. Depois de `Digitação OK`, regras do modal podem substituir a etapa direta por uma espera específica ou prontidão.
7. Carga já chegada recebe criticidade 4 no comportamento atual relatado.

A ordem global entre evento, etapa, criticidade, alertas, documentos, desvios e exceções ainda precisa ser caracterizada.

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
