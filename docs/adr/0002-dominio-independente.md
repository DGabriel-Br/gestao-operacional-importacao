# ADR-0002: Manter o domínio independente de frameworks e infraestrutura

**Data**: 2026-09-26  
**Status**: aceito  
**Decisores**: Mestre e Codex

## Contexto

As regras da planilha transformam dados brutos em decisões operacionais e constituem a parte mais valiosa do sistema. Elas precisam ser testadas isoladamente, preservadas durante mudanças de interface e persistência e comparadas com o comportamento atual.

## Decisão

O domínio usa TypeScript puro e não depende de NestJS, Next.js, React, Prisma, Zod, banco de dados ou integrações. Application orquestra casos de uso e define portas. Infrastructure implementa essas portas. Presentation apenas traduz entradas e apresenta resultados.

## Alternativas consideradas

### Regras em services NestJS e modelos Prisma

- **Vantagens**: menos arquivos no início.
- **Desvantagens**: regras acopladas a framework e persistência, com testes mais lentos e mudanças arriscadas.
- **Motivo da rejeição**: viola a necessidade de testar e preservar as regras independentemente da infraestrutura.

### Regras distribuídas entre API e frontend

- **Vantagens**: decisões próximas de cada tela.
- **Desvantagens**: duplicação, divergência e resultados diferentes por canal.
- **Motivo da rejeição**: a interface não pode decidir comportamento operacional.

## Consequências

### Positivas

- Regras rápidas de testar e simples de reutilizar.
- Frameworks e persistência podem mudar sem reescrever o domínio.
- Uma única fonte de decisão operacional.

### Negativas

- Mapeamentos explícitos serão necessários nas fronteiras.
- A equipe precisará manter a direção das dependências.

### Riscos

- Lógica escapar para adaptadores ou apresentação. Mitigação: testes por camada, revisão de dependências e ADRs para mudanças relevantes.
