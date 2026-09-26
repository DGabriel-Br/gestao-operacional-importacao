# Gestão Operacional de Importação

Aplicação web para gestão operacional de processos de importação. O projeto substituirá gradualmente uma ferramenta em Google Sheets, preservando suas regras de negócio em um domínio TypeScript testável e independente de interface, persistência e integrações.

## Estado atual

O repositório contém a fundação técnica e as duas primeiras fronteiras de ingestão:

- monorepo com pnpm workspaces;
- aplicação NestJS mínima, sem endpoints de negócio;
- aplicação Next.js mínima, sem telas de negócio;
- pacote de domínio vazio de regras operacionais;
- documentação de arquitetura e descoberta do domínio;
- contrato lógico e normalização técnica de linhas do eTrack;
- contrato lógico e normalização técnica de linhas do eComex;
- rastreabilidade e issues por linha nas duas fontes;
- typecheck e testes automatizados.

Os formatos físicos das exportações eTrack e eComex ainda não foram definidos. A ingestão não lê CSV, XLSX ou sistemas externos, não correlaciona as fontes, não persiste dados e não executa regras operacionais. Banco de dados, autenticação e demais integrações ainda não foram implementados.

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
