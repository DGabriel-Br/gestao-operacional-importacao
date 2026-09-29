# Gestão Operacional de Importação

Aplicação web para gestão operacional de processos de importação. O projeto substituirá gradualmente uma ferramenta em Google Sheets, preservando suas regras de negócio em um domínio TypeScript testável e independente de interface, persistência e integrações.

## Estado atual

O repositório contém a fundação técnica, as duas primeiras fronteiras de ingestão, nove famílias de regras do domínio e sua primeira composição multidimensional:

- monorepo com pnpm workspaces;
- aplicação NestJS mínima, sem endpoints de negócio;
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
- documentação de arquitetura e descoberta do domínio;
- contrato lógico e normalização técnica de linhas do eTrack;
- contrato lógico e normalização técnica de linhas do eComex;
- rastreabilidade e issues por linha nas duas fontes;
- reconhecimento legado das evidências de transbordo e atracação, separado da decisão de elegibilidade;
- typecheck e testes automatizados.

Os formatos físicos das exportações eTrack e eComex ainda não foram definidos. A ingestão não lê CSV, XLSX ou sistemas externos, não persiste dados e não executa regras operacionais. A projeção eTrack termina nos fatos específicos da fonte. A projeção eComex termina em um desvio individual explicável e chama somente as políticas públicas de impacto e lifecycle do Domain. A Application reproduz a correlação geral legado por dígitos para preservar matches e contagens básicas dos desvios `OPEN`. Sobre esses matches, a composição documental aplica a chave específica que preserva `/` e os padrões textuais caracterizados para produzir as flags digital e física. Nenhuma dessas funções executa o `OperationalAssessment`. Casos de uso completos, banco de dados, autenticação e demais integrações ainda não foram implementados.

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
