# Visão arquitetural

## Objetivo

Construir uma aplicação web que substitua gradualmente a ferramenta operacional atual em Google Sheets. A planilha será usada como referência de comportamento enquanto suas regras forem identificadas, caracterizadas e transferidas para o domínio.

## Estilo

O sistema é um monólito modular em um monorepo TypeScript.

```text
Presentation -> Application -> Domain
Infrastructure -> Application e Domain
```

Dependências apontam para dentro. O domínio não conhece frameworks, banco de dados, transporte HTTP ou fontes externas.

## Camadas

### Domain

Contém fatos, invariantes e decisões operacionais puras. Recebe todos os dados necessários como entrada, incluindo a data de avaliação quando uma regra depender do tempo.

### Application

Orquestra casos de uso e define as portas necessárias para persistência, relógio e integrações. Enquanto a API for o único executor, essa camada permanecerá organizada dentro dos módulos de `apps/api`.

### Infrastructure

Implementa as portas da Application. Abrangerá importadores, persistência Prisma e integrações somente quando essas capacidades forem introduzidas.

### Presentation

Inclui controllers NestJS e a aplicação Next.js. Traduz entradas e apresenta resultados, sem tomar decisões operacionais.

## Componentes atuais

- `apps/api`: shell mínimo da aplicação NestJS.
- `apps/api/src/application/operational-assessment`: projeções puras dos dados técnicos normalizados do eTrack e do eComex, correlação legado, composição do resumo de desvios e execução controlada do assessment completo por `assessOperationalProcess`.
- `apps/api/src/imports/etrack`: contrato lógico, validação e normalização técnica específicos do eTrack, ainda sem parser físico, endpoint, persistência ou caso de uso.
- `apps/api/src/imports/ecomex`: contrato lógico, validação e normalização técnica específicos do eComex, ainda sem parser físico, endpoint, persistência ou caso de uso.
- `apps/api/src/imports/shared`: representação e parsing técnico de datas ISO, compartilhados apenas porque possuem semântica idêntica nas duas fronteiras.
- `apps/web`: shell mínimo da aplicação Next.js.
- `packages/domain`: domínio puro com as políticas caracterizadas de acompanhamento, evento, etapa, criticidade, desvios, alerta principal, originais digital e físico e Mercante. `OperationalAssessment` coordena essas decisões sem fundi-las em status global.

Nenhum outro pacote foi criado porque ainda não existe uso concreto.

### Fronteira eTrack atual

```text
linha lógica eTrack
  -> validação de cabeçalhos e valores técnicos
  -> normalização técnica
  -> registro normalizado com origem, versão, linha, dados brutos e issues
```

Essa fronteira não interpreta observações, não classifica situações operacionais e não decide a aceitação total ou parcial de um lote. O formato físico da exportação permanece fora do contrato até que existam amostras confirmadas.

### Projeção eTrack da Application

```text
registro normalizado eTrack
  -> validação da capacidade de estabelecer fatos
  -> ETrackOperationalFacts ou issues de projeção
```

A primeira fronteira da Application possui um contrato mínimo de entrada, estruturalmente compatível com o resultado normalizado do importador, sem depender do módulo de Infrastructure. Ela traduz apenas os campos necessários ao futuro `OperationalAssessment`, preserva `Numero do Processo`, `Referencia Cliente` e a observação, converte o vocabulário técnico conhecido de modal para `air` ou `maritime` e mantém modal ausente ou desconhecido como `unknown`. `Master`, data de faturamento e campos adicionais permanecem fora dessa projeção porque nenhuma política atual os consome.

Valores temporais ausentes representam ausência confirmada. Valores válidos `date` e `date-time` fornecem os componentes de `CivilDate`; no caso de `date-time`, a projeção preserva a data civil escrita pela fonte sem converter offset ou timezone. Um valor temporal presente e tecnicamente inválido impede o resultado `ready` e produz issue específico, em vez de virar ausência ou `false`. Os resultados `ready` e `invalid` preservam origem, versão da fonte e número da linha; versão ou número de linha inválidos também impedem `ready`. Essa decisão é da fronteira Application e não caracteriza uma regra da planilha. A semântica definitiva dos timestamps reais da exportação permanece aberta.

A projeção não reconhece eventos, documentos ou Mercante, não infere FEDEX, não correlaciona eTrack com eComex e não chama `assessOperationalProcess`. A futura composição deverá acrescentar data de avaliação e fatos de desvios antes de formar `OperationalAssessmentFacts`.

### Fronteira eComex atual

```text
linha lógica eComex
  -> validação de cabeçalhos e valores técnicos
  -> normalização técnica
  -> registro normalizado com origem, versão, linha, dados brutos e issues
```

Essa fronteira não classifica desvios, não interpreta `FIM` como estado de abertura, não correlaciona `EMBARQUE` com o eTrack e não decide a aceitação total ou parcial de um lote. O formato físico da exportação permanece fora do contrato até que existam amostras confirmadas.

O contrato atual recebe `rawData` com valores JavaScript já decodificados. Ele não recebe bytes, não detecta BOM, não declara charset e não possui parser CSV físico. Uma futura responsabilidade de decoding deve permanecer na infraestrutura ou fronteira técnica específica do eComex, antes do contrato lógico atual:

```text
bytes da exportação eComex
  -> decoder e parser físico específicos da fonte
  -> EComexRowInput com strings técnicas
  -> importador e normalizador lógico atual
  -> projeção da Application
```

A investigação do snapshot de 29/09/2026 confirmou U+FFFD armazenado na aba `Importação eComex`, mas não encontrou o arquivo original no workspace. Logo, nenhum charset da fonte foi inferido e nenhum decoder ou reparador textual foi introduzido.

### Projeção eComex da Application

```text
registro normalizado eComex
  -> validação da capacidade de estabelecer o desvio individual
  -> políticas de impacto e lifecycle do Domain
  -> EComexOperationalDeviation ou issues de projeção
```

A projeção possui contrato mínimo estruturalmente compatível com o resultado do importador e não depende de seus tipos concretos. `EMBARQUE` permanece como `ecomexShipmentReference`, sem redução para dígitos, correlação ou identidade definitiva. `DESCR_DESVIO` e `OBSERVACOES` atravessam a Application semanticamente intactos; o catálogo, o fallback `BLOCKING`, a distinção exata de `(INV)` e a regra contextual da fatura assinada continuam exclusivamente no Domain.

`FIM` ausente fornece `hasEnd = false`; `date` ou `date-time` válidos fornecem `hasEnd = true`; valor inválido impede `ready`. A decisão `OPEN` ou `CLOSED` continua sendo produzida por `determineDeviationLifecycle`. `EMBARQUE` ou `DESCR_DESVIO` tecnicamente ausentes ou inválidos também impedem um desvio operacional confiável, enquanto uma descrição textual desconhecida permanece válida e segue o fallback caracterizado no Domain. Origem, versão e número da linha são preservados nos resultados.

`INICIO`, `MODAL`, `JUSTIFICATIVA`, `APONTADO_POR`, `CONCLUIDO_POR`, `EXPORT_NOME` e `INVOICE` permanecem fora dessa projeção por não possuírem consumidor nas duas políticas atuais. Issues nesses campos não alteram o resultado individual desta fronteira. A projeção não correlaciona fontes, não agrupa ou conta desvios, não produz flags documentais e não executa `OperationalAssessment`.

### Correlação legado e agregação básica na Application

```text
ETrackOperationalFacts + EComexOperationalDeviation[]
  -> chave legado por remoção de caracteres que não sejam dígitos ASCII
  -> igualdade textual exata entre chaves não vazias
  -> matches rastreáveis + contagens dos impactos OPEN
```

A correlação usa exclusivamente `customerReference` e `ecomexShipmentReference`. Os valores originais permanecem no resultado; a chave derivada não é `processId`, identidade canônica nem chave de persistência. Ausência de `customerReference` ou texto sem dígitos produz `uncorrelatable`. Uma chave válida sem correspondências produz `correlated` com zero matches e contagens zero.

A junção é um-para-muitos, preserva a ordem e os traces das linhas eComex e não remove duplicatas. Desvios `CLOSED` permanecem nos matches para auditoria, mas apenas `OPEN` participa das contagens `BLOCKING`, `NON_BLOCKING` e `unclassified`. A Application lê as decisões já projetadas e não reexecuta impacto ou lifecycle.

Referências eComex brutas distintas que colapsam na mesma chave continuam correlacionadas conforme o legado e produzem `LEGACY_CORRELATION_REFERENCE_COLLISION`. Essa issue apenas expõe a perda de informação. A função individual não detecta colisões entre múltiplos registros eTrack porque recebe um único processo por execução; o caso de uso em lote descrito adiante acrescenta esse diagnóstico transversal sem mudar o resultado individual. A correlação geral não produz flags documentais nem executa `OperationalAssessment`.

### Composição do resumo de desvios

```text
OperationalDeviationCorrelationResult
  -> preserva uncorrelatable sem fabricar ausências
  -> reutiliza as contagens OPEN existentes
  -> filtra os matches pela chave documental que preserva barra
  -> reconhece independentemente os desvios digital e físico
  -> produz OperationalDeviationSummary
```

A composição recebe o resultado da correlação, não registros globais nem as fontes originais. `uncorrelatable` permanece sem summary. Um resultado `correlated` sem correspondências produz legitimamente contagens zero e flags falsas. As três contagens do summary são copiadas da agregação da correlação, sem reclassificar impacto ou reexecutar lifecycle.

As fórmulas documentais usam uma segunda normalização de referência: removem tudo exceto dígitos ASCII e `/`. Essa chave é aplicada somente aos `matchedDeviations` da correlação geral. Assim, as contagens continuam baseadas na igualdade por dígitos, enquanto as flags usam o subconjunto cuja barra também coincide. Os valores brutos não são substituídos, zeros à esquerda são preservados e a subcorrelação não estabelece identidade canônica.

Somente desvios `OPEN` cuja descrição corresponda, sem diferenciar caixa, a `documentos originais n[aã]o recebidos do agente de carga` podem ativar flags. A flag digital exige o regex legado `(original|orignal|originais|bl|conhecimento).*(digitaliz)|digitaliz.*(original|orignal|originais|bl|conhecimento)` sobre `OBSERVACOES` em minúsculas. A flag física exige `(conhecimento|bl|awb|hawb).*(original|orignal).*f[ií]sico`. O typo `orignal` é preservado porque existe na fórmula. Não há fuzzy matching nem normalização textual adicional.

Issues de colisão, duplicatas, ordem e traces continuam preservadas no resultado original da correlação. A subcorrelação documental não elimina matches nem altera as contagens, e a composição não executa `OperationalAssessment`.

### Execução do OperationalAssessment na Application

```text
ETrackOperationalFacts
+ OperationalDeviationCorrelationResult
+ evaluationDate explícita
  -> composeOperationalDeviationSummary
  -> OperationalAssessmentFacts
  -> assessOperationalProcess
  -> resultado assessed ou unassessable
```

A função pura da Application recebe somente fatos eTrack já projetados, uma correlação já executada e uma `CivilDate` de avaliação. Ela não recebe linhas técnicas, não correlaciona novamente, não classifica desvios e não interpreta observações. O `OperationalDeviationSummary` é produzido exclusivamente pela composição documental existente, e `assessOperationalProcess` é a única porta usada para executar as políticas multidimensionais do Domain.

Uma correlação `uncorrelatable` produz `unassessable`, preservando os fatos eTrack, a data de avaliação, o motivo e as issues originais, sem fabricar summary. Uma correlação `correlated`, inclusive com zero matches, produz `assessed`. Issues diagnósticas como colisão permanecem na projeção da correlação e não bloqueiam a avaliação.

O resultado interno preserva `ETrackOperationalFacts`, `evaluationDate`, a projeção do summary, os `OperationalAssessmentFacts` enviados e o assessment completo. Assim, `processNumber` e `customerReference` continuam disponíveis como contexto da Application sem entrar nas regras do Domain. Elegibilidade `ineligible` ou `undetermined` não impede o assessment, e tensões entre etapa, Mercante, documentos, criticidade e alerta não são reconciliadas.

### Avaliação operacional em lote na Application

```text
ETrackOperationalFacts[]
+ EComexOperationalDeviation[]
+ evaluationDate explícita
  -> correlação e assessment individual para cada entrada eTrack
  -> entries na ordem original + diagnósticos transversais
```

`assessOperationalBatch` é uma função pura que chama, para cada processo, `correlateOperationalDeviations` e `assessCorrelatedOperationalProcess`. O resultado integral `assessed` ou `unassessable` permanece na posição original; uma correlação individual impossível não interrompe os demais processos. A coleção eComex é reutilizada sem índice alternativo, pré-agrupamento ou nova implementação de matching. Não existe ordenação por criticidade, alerta, ETA ou identificador.

O lote reutiliza `createLegacyCorrelationKey` para detectar quando referências eTrack brutas distintas produzem a mesma chave geral por dígitos. Cada chave colidente gera um único `LEGACY_ETRACK_CORRELATION_KEY_COLLISION`, com as referências distintas na ordem de primeira ocorrência e contexto mínimo de índice e processo. Referências ausentes, sem dígitos ou literalmente repetidas não geram esse diagnóstico. A colisão não escolhe vencedor, não divide desvios e não bloqueia assessment: conforme o comportamento legado preservado, dois processos colidentes podem receber o mesmo desvio eComex. Issues individuais de colisão entre referências eComex continuam separadas nos respectivos resultados.

O lote não conhece a chave documental que preserva `/`, não executa políticas do Domain diretamente, não produz status global, score, prioridade, persistência ou IO. `processNumber` permanece somente como contexto e não participa da correlação nem da detecção da chave.

### Snapshot operacional sobre fontes lógicas decodificadas

```text
ETrackRowInput[] + EComexRowInput[] + evaluationDate explícita
  -> importadores lógicos por linha
  -> projeções operacionais por linha
  -> validação fail-closed da fonte completa
  -> assessOperationalBatch
  -> snapshot ready ou invalid_source_data
```

`runOperationalSnapshot` é a primeira orquestração completa em memória depois do decoding físico. Ela recebe somente valores JavaScript já decodificados e reutiliza `importETrackRow`, `importEComexRow`, `projectETrackOperationalFacts`, `projectEComexOperationalDeviation` e, quando todas as linhas são confiáveis, `assessOperationalBatch`. A função não recebe bytes, arquivos, strings CSV ou cabeçalhos físicos e não implementa charset, BOM, parsing de CSV ou reparo de texto.

A política inicial é fail-closed: qualquer issue de importação com severidade `error` ou qualquer projeção `invalid` produz `invalid_source_data`, preserva trace, issues técnicas e issues de projeção e impede a criação do `OperationalBatchAssessment`. Todas as linhas das duas fontes são examinadas para que as falhas sejam acumuladas; nenhuma linha inválida é filtrada para fabricar um snapshot parcial. Issues `warning` permanecem nas projeções prontas e não bloqueiam o snapshot.

Fontes vazias são entradas válidas. eTrack vazio com eComex válido produz batch vazio; eTrack válido com eComex vazio avalia os processos com zero desvios. Um resultado individual `unassessable` também não significa fonte inválida e permanece dentro de um snapshot `ready`, assim como os diagnósticos de colisão da Etapa 23. `assessOperationalBatch` é a única porta desse caso de uso para correlação, composição documental e avaliação operacional.

### Validação diferencial histórica

O primeiro harness diferencial está localizado junto aos testes da Application e congela oito processos do snapshot legado de 29/09/2026. Ele usa `evaluationDate` explícita, executa as fronteiras e composições existentes e compara nove dimensões por processo como `MATCH`, `MISMATCH` ou `NOT_COMPARABLE`.

As expectativas legado são fixtures estáticas independentes das funções do Domain. O teste não acessa Google Sheets, Google Drive, HTTP, banco ou relógio e não implementa um segundo motor legado. Divergências permanecem resultados diagnósticos com categoria e primeira fronteira provável. A matriz confirmada está em [Validação diferencial do snapshot legado de 29/09/2026](../validation/legacy-snapshot-2026-09-29.md).

Os contratos e os importadores das duas fontes permanecem separados. A comparação da Etapa 5 extraiu somente a representação e o parsing técnico de datas ISO, sem nomes de campos, mensagens, issues ou conhecimento das fontes. Cabeçalhos, modais, textos, rastreabilidade, projeções normalizadas e produção de issues permanecem específicos. A taxonomia de issues não foi compartilhada porque ainda mistura localização e natureza do problema.

## Componentes futuros documentados

Quando necessários, poderão existir pacotes ou módulos para validação Zod, Prisma, contratos de transporte e utilidades realmente compartilhadas. A criação dependerá de uma etapa aprovada e de um consumidor real.

## Restrições

- Não utilizar microserviços.
- Não executar regras no frontend.
- Não expor modelos Prisma fora da infraestrutura.
- Não interpretar semanticamente observações nos importadores.
- Não criar motor genérico de regras.
- Não introduzir infraestrutura antes de necessidade comprovada.

O reconhecimento semântico usado pela elegibilidade ocorre no domínio. Ele recebe a observação preservada por uma futura camada de mapeamento, reconhece apenas os padrões caracterizados e entrega evidências à política sem conhecer o contrato do eTrack.

O reconhecimento de evento operacional também ocorre no domínio. Sua normalização reproduz somente o comportamento textual caracterizado dessa família e termina ao produzir um evento reconhecido ou `UNIDENTIFIED`.

A determinação da etapa recebe esse evento já reconhecido. Somente `TYPING_COMPLETED` recebe também modal de domínio e presença da referência Mercante. Essa política não relê observações, não conhece os vocabulários das fontes e não determina alertas, criticidade, desvios ou o status detalhado do Mercante.

A criticidade recebe ETA civil válida ou ausência confirmada, presença de chegada e data civil de avaliação explícita. A política usa dias corridos do calendário gregoriano, não acessa relógio global e não determina prioridade, alerta ou ordenação da fila.

O alerta operacional principal recebe etapa, contagens prontas de desvios abertos classificados, ETA civil, presença de chegada e data de avaliação. A política reproduz a primeira condição verdadeira da coluna legada e retorna somente um alerta. Ela compartilha apenas o conceito e a diferença de datas civis com a criticidade, sem consumir seu resultado, contar desvios, detalhar Mercante ou documentos, nem ordenar o dashboard.

A classificação de um desvio individual recebe descrição e observação preservadas pela projeção eComex da Application. Sua normalização textual é específica dessa família, reproduz somente o catálogo e os contextos caracterizados e não depende do contrato eComex. Separadamente, o lifecycle recebe apenas presença ou ausência de encerramento já validada. Nenhuma dessas políticas correlaciona fontes, agrega desvios, conta ocorrências ou gera alertas.

A dimensão do BL original digitalizado separa o reconhecimento textual da decisão. O reconhecedor compara somente três evidências caracterizadas e seleciona a última posição normalizada. A política recebe modal de domínio, evidência já reconhecida e o fato pronto de existência do desvio aberto relacionado. Ela não busca nem correlaciona desvios, não determina original físico ou Mercante e preserva divergências entre evidência e desvio como estados e issues explícitos.

### Composição do OperationalAssessment

`OperationalAssessment` é uma folha de composição pura dentro do Domain. Recebe fatos de domínio já interpretados, chama os reconhecedores e políticas existentes e preserva suas decisões completas:

```text
fatos válidos de domínio
  -> políticas independentes existentes
  -> OperationalAssessment multidimensional
```

A composição não recebe registros eTrack ou eComex, não faz parsing, não correlaciona fontes, não agrega listas de desvios e não decide inclusão na fila. As contagens abertas classificadas, a contagem aberta não classificada e as flags dos desvios específicos de originais chegam prontas. Somente as duas contagens já previstas alimentam o alerta principal; a contagem não classificada é preservada sem comportamento inferido.

A mesma observação é entregue separadamente a cada reconhecedor. Não existe normalização textual global, pois cada família possui catálogo, normalização e precedência próprios. A etapa consome o evento reconhecido, o Mercante consome o status digital e o alerta consome a etapa. Essas dependências de cálculo não formam uma precedência global nem permitem que uma dimensão sobrescreva outra.

Elegibilidade `ineligible` ou `undetermined` não encerra a composição. O assessment permanece uma fotografia diagnóstica com todas as dimensões calculáveis. Não existe `overallStatus`, prioridade, score, prontidão global ou array global de issues. Divergências entre etapa, Mercante, documentos e alerta permanecem simultaneamente visíveis em suas decisões de origem.

O contrato inicial do assessment aceita os modais já suportados pela política de acompanhamento: `air`, `maritime` e `unknown`. O modal `other` continua disponível nas políticas que já o caracterizam, mas sua composição completa aguarda uma decisão explícita para acompanhamento operacional.

## Verificação arquitetural

- O pacote de domínio não declara dependências de runtime.
- Typecheck e testes são executados por workspace.
- Mudanças arquiteturais relevantes exigem ADR.
- Regras futuras exigirão testes isolados e exemplos de caracterização.
