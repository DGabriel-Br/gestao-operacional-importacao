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
- `apps/api/src/application/operational-assessment`: projeções puras dos dados técnicos normalizados do eTrack em fatos específicos da fonte e do eComex em desvios operacionais individuais. Somente a projeção eComex chama as políticas públicas de impacto e lifecycle do Domain; nenhuma executa o assessment completo.
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
