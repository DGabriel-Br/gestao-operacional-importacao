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
- `apps/api/src/imports/etrack`: contrato lógico, validação e normalização técnica específicos do eTrack, ainda sem parser físico, endpoint, persistência ou caso de uso.
- `apps/api/src/imports/ecomex`: contrato lógico, validação e normalização técnica específicos do eComex, ainda sem parser físico, endpoint, persistência ou caso de uso.
- `apps/api/src/imports/shared`: representação e parsing técnico de datas ISO, compartilhados apenas porque possuem semântica idêntica nas duas fronteiras.
- `apps/web`: shell mínimo da aplicação Next.js.
- `packages/domain`: domínio puro com a elegibilidade para acompanhamento operacional, o reconhecimento do evento operacional, a determinação da etapa operacional, a criticidade operacional, as decisões individuais de impacto e lifecycle de desvios, o alerta operacional principal e a situação do BL original digitalizado, mantendo essas dimensões independentes.

Nenhum outro pacote foi criado porque ainda não existe uso concreto.

### Fronteira eTrack atual

```text
linha lógica eTrack
  -> validação de cabeçalhos e valores técnicos
  -> normalização técnica
  -> registro normalizado com origem, versão, linha, dados brutos e issues
```

Essa fronteira não interpreta observações, não classifica situações operacionais e não decide a aceitação total ou parcial de um lote. O formato físico da exportação permanece fora do contrato até que existam amostras confirmadas.

### Fronteira eComex atual

```text
linha lógica eComex
  -> validação de cabeçalhos e valores técnicos
  -> normalização técnica
  -> registro normalizado com origem, versão, linha, dados brutos e issues
```

Essa fronteira não classifica desvios, não interpreta `FIM` como estado de abertura, não correlaciona `EMBARQUE` com o eTrack e não decide a aceitação total ou parcial de um lote. O formato físico da exportação permanece fora do contrato até que existam amostras confirmadas.

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

A classificação de um desvio individual recebe descrição e observação preservadas por uma futura camada de mapeamento. Sua normalização textual é específica dessa família, reproduz somente o catálogo e os contextos caracterizados e não depende do contrato eComex. Separadamente, o lifecycle recebe apenas presença ou ausência de encerramento já validada. Nenhuma dessas políticas correlaciona fontes, agrega desvios, conta ocorrências ou gera alertas.

A dimensão do BL original digitalizado separa o reconhecimento textual da decisão. O reconhecedor compara somente três evidências caracterizadas e seleciona a última posição normalizada. A política recebe modal de domínio, evidência já reconhecida e o fato pronto de existência do desvio aberto relacionado. Ela não busca nem correlaciona desvios, não determina original físico ou Mercante e preserva divergências entre evidência e desvio como estados e issues explícitos.

## Verificação arquitetural

- O pacote de domínio não declara dependências de runtime.
- Typecheck e testes são executados por workspace.
- Mudanças arquiteturais relevantes exigem ADR.
- Regras futuras exigirão testes isolados e exemplos de caracterização.
