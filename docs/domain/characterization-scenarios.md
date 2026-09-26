# Cenários de caracterização

Estes cenários são exemplos documentais anonimizados para confrontar o comportamento relatado com a planilha atual. Eles não são fixtures executáveis e não representam regras implementadas.

Os resultados chamados de `Relatado` derivam do briefing operacional da Etapa 2 em 2026-09-26. Eles ainda precisam de evidência reproduzível da planilha e aprovação humana antes de orientar testes de domínio.

## Convenções

- `D0` representa a data de avaliação do cenário.
- Identificadores são fictícios.
- Quando um registro eTrack e um registro eComex aparecem juntos, o cenário assume apenas para caracterização que `Referencia Cliente` e `EMBARQUE` foram associados.
- `Resultado relatado` registra somente o comportamento fornecido nesta etapa.
- `Evidência necessária` indica o que deve ser obtido da planilha antes de aprovar a regra futura.

Os cenários são rascunhos documentais preparados para caracterização. Eles ainda não constituem evidência reproduzível da planilha.

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

**Regras relacionadas**: `RULE-STAGE-002`, `RULE-MERC-003`

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

**Não afirmado neste cenário**

- O nível numérico de criticidade, pois a relação entre ETA vencido e a faixa `em até 5 dias` não foi explicitada.

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

**Evidência necessária**

- Confirmar como desvios de documentos originais alteram o texto final da situação.

## SCN-011: BL original físico pendente

**Regras relacionadas**: `RULE-PHYSICAL-001`

**Dados relevantes**

- Processo: `PROCESS-011`.
- Embarque: `SHIPMENT-011`.
- Modal: marítimo.
- `Datas Originais`: sem evidência de recebimento.
- Existe evidência operacional de aguardo do BL físico, cujo padrão textual real ainda será extraído da planilha.

**Resultado relatado a validar**

- Situação esperada na ferramenta atual: `Aguardando BL original físico`.

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

**Regras relacionadas**: `RULE-MERC-001`, `RULE-MERC-002`

**Dados relevantes**

- Processo: `PROCESS-013`.
- Embarque: `SHIPMENT-013`.
- Modal: marítimo.
- Observação contém primeiro `MERCANTE CONFERIDO COM BL E SISTEMA`.
- Evidência identificável posterior contém `PENDÊNCIA NO MERCANTE`.

**Resultado relatado**

- A pendência no Mercante volta a ficar ativa.
- Mercante não permanece simplesmente como conferido.

**Evidência necessária**

- Confirmar como a planilha determina a ordem das evidências.
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

**Variações necessárias**

1. `Original digitalizado OK` seguido de `Aguardando envio do BL original digitalizado`.
2. `Aguardando envio do BL original digitalizado` seguido de `Original digitalizado OK`.

**Evidência necessária**

- Resultados atuais das duas variações.
- Regra de ordenação textual ou temporal.

## SCN-015: Marítimo sem ETA mantido em acompanhamento

**Regras relacionadas**: `RULE-TRACK-002`, `RULE-TRACK-003`

**Dados relevantes**

- Processo: `PROCESS-015`.
- Embarque: `SHIPMENT-015`.
- Modal: marítimo.
- `Data Registro`: ausente.
- `Data da Previsão de Chegada`: ausente.
- Observação contém sinal de espera por dados de atracação ou confirmação de transbordo.

**Resultado relatado**

- O processo pode permanecer na fila operacional principal mesmo sem ETA.

**Evidência necessária**

- Frases exatas reconhecidas.
- Demais condições usadas pela planilha.
- Resultado quando os dois sinais aparecem ou deixam de aparecer.

## Matriz mínima de cobertura

| Comportamento solicitado                      | Cenário   |
| --------------------------------------------- | --------- |
| Marítimo aguardando Mercante                  | `SCN-001` |
| Marítimo com Mercante pronto para conferência | `SCN-002` |
| Aéreo aguardando CCT                          | `SCN-003` |
| Desvio impeditivo                             | `SCN-004` |
| Apenas desvio não impeditivo                  | `SCN-005` |
| Pendência sem desvio aberto                   | `SCN-006` |
| Evento não identificado                       | `SCN-007` |
| ETA vencido sem chegada                       | `SCN-008` |
| Processo conferido aguardando registro        | `SCN-009` |
| BL original digitalizado pendente             | `SCN-010` |
| BL original físico pendente                   | `SCN-011` |
| Exceção FEDEX a validar                       | `SCN-012` |
