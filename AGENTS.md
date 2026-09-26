# AGENTS.md

## Comunicação

- Responda em português.
- Chame o usuário de Mestre ou David.
- Não use travessão.
- Comunique riscos, suposições e decisões explicitamente.

## Projeto

Este projeto substitui gradualmente uma ferramenta operacional de importação existente em Google Sheets.

A planilha atual contém regras de negócio e deve ser tratada como referência de comportamento até que cada regra seja caracterizada e aprovada.

## Arquitetura

- Use TypeScript como linguagem principal.
- Preserve o monólito modular e o monorepo.
- Não introduza microserviços.
- O pacote `domain` deve usar TypeScript puro.
- `domain` não pode importar NestJS, Next.js, React, Prisma ou Zod.
- Presentation não decide regras operacionais.
- Infrastructure implementa portas definidas pela Application.
- PostgreSQL será a fonte principal da verdade quando a persistência for introduzida.
- Não deixe modelos Prisma escaparem da Infrastructure.
- Não transforme um pacote compartilhado em depósito genérico.
- Não crie diretórios ou pacotes antes de existir uso concreto.

## Regras de negócio

- Não invente regras ausentes.
- Registre ambiguidades em `docs/domain/open-questions.md`.
- Toda regra crítica deve possuir teste isolado.
- Toda decisão deve considerar valores desconhecidos e contraditórios.
- Regras dependentes do tempo devem receber a data de avaliação.
- Preserve códigos de razão e evidências para decisões operacionais.

## Integrações

- Integrações obtêm, validam e normalizam dados externos.
- Integrações não decidem etapa, prioridade, alerta ou impedimento.
- Preserve origem, lote, linha e erros de importação.
- Mantenha contratos separados para eTrack e eComex.

## Código

- Prefira código simples, previsível e autoexplicativo.
- Não adicione comentários óbvios.
- Não crie abstrações antes de uma necessidade concreta.
- Não adicione dependências sem justificar seu uso.
- Não altere decisões arquiteturais sem atualizar a documentação apropriada.
- Evite importações profundas entre pacotes.
- Mantenha testes unitários próximos ao código testado.

## Verificação

Antes de concluir uma alteração, execute:

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm format:check
```

## Limites de escopo

Não adicione sem solicitação explícita:

- microserviços;
- filas ou brokers;
- Redis;
- CQRS;
- event sourcing;
- motores genéricos de regras;
- autenticação complexa;
- Docker ou infraestrutura prematura;
- notificações ou IA.
