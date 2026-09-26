# ADR-0001: Adotar monólito modular em monorepo TypeScript

**Data**: 2026-09-26  
**Status**: aceito  
**Decisores**: Mestre e Codex

## Contexto

O sistema substituirá gradualmente uma ferramenta operacional em Google Sheets. O projeto precisa preservar regras de negócio complexas sem assumir o custo operacional de uma arquitetura distribuída. Frontend, backend e domínio devem evoluir de forma coordenada e incremental.

## Decisão

Usamos um monólito modular em monorepo, com TypeScript como linguagem principal, Next.js e React no frontend, NestJS no backend, PostgreSQL como banco principal, Prisma como ORM e Zod nas fronteiras de validação quando essas capacidades forem introduzidas.

## Alternativas consideradas

### Microserviços

- **Vantagens**: implantação e escala independentes por serviço.
- **Desvantagens**: maior custo de operação, observabilidade, contratos e consistência distribuída.
- **Motivo da rejeição**: não existe necessidade concreta que compense essa complexidade no MVP.

### Repositórios e linguagens separados

- **Vantagens**: autonomia tecnológica entre componentes.
- **Desvantagens**: contratos duplicados, mais ferramentas e maior custo de coordenação.
- **Motivo da rejeição**: o produto será desenvolvido como uma unidade e se beneficia de uma base TypeScript comum.

## Consequências

### Positivas

- Desenvolvimento e testes coordenados em um único repositório.
- Menor custo operacional e cognitivo.
- Fronteiras modulares podem evoluir sem distribuição prematura.

### Negativas

- Os módulos compartilham o mesmo ciclo de implantação inicial.
- A disciplina de dependências precisa ser mantida dentro do monólito.

### Riscos

- Acoplamento entre módulos. Mitigação: dependências explícitas, composição centralizada e revisão arquitetural.
