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
- `apps/web`: shell mínimo da aplicação Next.js.
- `packages/domain`: fronteira do domínio puro, ainda sem regras operacionais.

Nenhum outro pacote foi criado porque ainda não existe uso concreto.

## Componentes futuros documentados

Quando necessários, poderão existir pacotes ou módulos para validação Zod, Prisma, contratos de transporte e utilidades realmente compartilhadas. A criação dependerá de uma etapa aprovada e de um consumidor real.

## Restrições

- Não utilizar microserviços.
- Não executar regras no frontend.
- Não expor modelos Prisma fora da infraestrutura.
- Não interpretar semanticamente observações nos importadores.
- Não criar motor genérico de regras.
- Não introduzir infraestrutura antes de necessidade comprovada.

## Verificação arquitetural

- O pacote de domínio não declara dependências de runtime.
- Typecheck e testes são executados por workspace.
- Mudanças arquiteturais relevantes exigem ADR.
- Regras futuras exigirão testes isolados e exemplos de caracterização.
