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
- documentação de arquitetura e descoberta do domínio;
- contrato lógico e normalização técnica de linhas do eTrack;
- contrato lógico e normalização técnica de linhas do eComex;
- rastreabilidade e issues por linha nas duas fontes;
- reconhecimento legado das evidências de transbordo e atracação, separado da decisão de elegibilidade;
- typecheck e testes automatizados.

Os formatos físicos das exportações eTrack e eComex ainda não foram definidos. A ingestão não lê CSV, XLSX ou sistemas externos, não correlaciona as fontes, não persiste dados e não executa regras operacionais. As regras do domínio ainda não estão conectadas a casos de uso. Banco de dados, autenticação e demais integrações ainda não foram implementados.

## Estrutura

```text
apps/
  api/                 API NestJS, composition root e integrações específicas
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
