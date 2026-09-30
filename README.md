# Gestão Operacional de Importação

Aplicação web para gestão operacional de processos de importação. O projeto substituirá gradualmente uma ferramenta em Google Sheets, preservando suas regras de negócio em um domínio TypeScript testável e independente de interface, persistência e integrações.

## Estado atual

O repositório contém a fundação técnica, as duas primeiras fronteiras de ingestão, nove famílias de regras do domínio e sua primeira composição multidimensional:

- monorepo com pnpm workspaces;
- aplicação NestJS mínima com um adaptador HTTP stateless para o snapshot operacional;
- aplicação Next.js mínima, sem telas de negócio;
- pacote de domínio puro com a elegibilidade para acompanhamento operacional principal;
- reconhecimento do evento operacional pelo algoritmo textual legado;
- determinação da etapa operacional a partir do evento reconhecido e, para `TYPING_COMPLETED`, do modal e da presença da referência Mercante;
- determinação da criticidade operacional numérica a partir de ETA, presença de chegada e data civil de avaliação explícita;
- classificação explicável do impacto e do estado aberto ou encerrado de desvios individuais;
- determinação explicável do alerta operacional principal com a precedência legada da coluna de Processamento;
- reconhecimento textual e determinação explicável da situação do BL original digitalizado, sem misturá-lo ao original físico ou ao Mercante;
- reconhecimento textual e determinação explicável do original físico, incluindo a heurística legado de FEDEX e sua janela própria de ETA;
- reconhecimento textual e determinação explicável da situação operacional do Mercante;
- composição pura `OperationalAssessment`, que preserva as decisões completas sem criar status global, prioridade ou correlação entre fontes;
- fronteira da Application que projeta uma linha eTrack tecnicamente normalizada em fatos operacionais confiáveis sem executar o assessment;
- fronteira da Application que projeta uma linha eComex tecnicamente normalizada em um desvio operacional individual, executando as políticas existentes de impacto e lifecycle sem correlacionar ou agregar registros;
- correlação legado na Application entre `Referencia Cliente` e `EMBARQUE` pela igualdade após remoção de caracteres não numéricos, preservando matches e contagens básicas de desvios abertos sem estabelecer identidade canônica;
- composição do `OperationalDeviationSummary` a partir das contagens da correlação geral e das flags documentais caracterizadas, com subcorrelação legado que preserva `/`;
- composição da Application que recebe fatos eTrack, correlação pronta e data de avaliação explícita, produz o summary e executa o `OperationalAssessment` somente quando a correlação é utilizável;
- caso de uso puro em lote que preserva a ordem dos fatos eTrack, avalia cada processo independentemente e diagnostica colisões entre referências eTrack distintas sem alterar a correlação legado;
- caso de uso puro de snapshot que recebe linhas lógicas já decodificadas, reutiliza importadores, projeções e batch assessment existentes e bloqueia o snapshot completo quando qualquer linha possui erro técnico ou projeção inválida;
- endpoint `POST /operational-assessment/snapshot`, que valida o contrato JSON, converte a data civil e delega exclusivamente para `runOperationalSnapshot`;
- harness de validação diferencial com fixture estática do snapshot legado de 29/09/2026, que compara oito processos por dimensão sem alterar regras para eliminar divergências;
- documentação de arquitetura e descoberta do domínio;
- contrato lógico e normalização técnica de linhas do eTrack;
- contrato lógico e normalização técnica de linhas do eComex;
- rastreabilidade e issues por linha nas duas fontes;
- reconhecimento legado das evidências de transbordo e atracação, separado da decisão de elegibilidade;
- typecheck e testes automatizados.

Os formatos físicos das exportações eTrack e eComex ainda não foram definidos. A ingestão não lê CSV, XLSX ou sistemas externos e não persiste dados. A projeção eTrack termina nos fatos específicos da fonte. A projeção eComex termina em um desvio individual explicável e chama somente as políticas públicas de impacto e lifecycle do Domain. A Application reproduz a correlação geral legado por dígitos para preservar matches e contagens básicas dos desvios `OPEN`. Sobre esses matches, a composição documental aplica a chave específica que preserva `/` e os padrões textuais caracterizados para produzir as flags digital e física. A composição final da Application reutiliza essas saídas, exige uma data de avaliação explícita e chama apenas `assessOperationalProcess`; correlação impossível permanece sem assessment, enquanto zero matches é um resultado correlacionado válido. O primeiro caso de uso em lote recebe somente projeções já confiáveis, preserva um resultado individual por entrada eTrack e expõe colisões da chave legado como diagnóstico, sem resolvê-las ou ordenar os processos. `runOperationalSnapshot` começa depois do decoding físico: recebe linhas JavaScript, executa os importadores lógicos e as projeções existentes e só chama `assessOperationalBatch` quando nenhuma linha possui erro técnico ou projeção inválida. Warnings, colisões diagnósticas e resultados individuais `unassessable` não invalidam a fonte; linhas inválidas nunca são descartadas para fabricar um snapshot parcial. O primeiro adaptador HTTP aceita somente JSON com linhas já decodificadas e não implementa upload, CSV, encoding ou persistência. A validação diferencial de 29/09/2026 é exclusivamente um teste histórico estático, sem acesso em runtime à planilha. IO de arquivos, banco de dados, autenticação e demais integrações ainda não foram implementados.

## Estrutura

```text
apps/
  api/                 API NestJS, Application inicial e integrações específicas
  web/                 Aplicação Next.js
packages/
  domain/              Regras de negócio puras
docs/
  adr/                 Architecture Decision Records
  architecture/        Visão e limites arquiteturais
  domain/              Questões de domínio ainda não respondidas
  validation/          Snapshots históricos de validação diferencial
```

Pacotes e diretórios futuros só serão criados quando houver necessidade concreta.

## Requisitos

- Node.js 24 ou superior
- Corepack

O projeto fixa o pnpm 12.6.0 pelo campo `packageManager` do `package.json`.

## Comandos

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
corepack pnpm format:check
```

Para iniciar os aplicativos em desenvolvimento:

```bash
corepack pnpm dev:api
corepack pnpm dev:web
```

A API usa a porta 3001 por padrão. O Next.js usa a porta 3000.

## Princípios

- Eficiência acima de complexidade.
- Monólito modular, sem microserviços.
- Regras operacionais somente no domínio.
- Interface sem decisões de negócio.
- Integrações limitadas a obtenção, validação e normalização de dados.
- Mudanças incrementais acompanhadas por testes e documentação.

Consulte [a visão arquitetural](docs/architecture/overview.md) e [os ADRs](docs/adr/README.md) para detalhes.
