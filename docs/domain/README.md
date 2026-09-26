# Descoberta do domínio

Esta pasta registra o conhecimento operacional necessário para substituir gradualmente a ferramenta atual em Google Sheets.

A planilha é uma especificação executável temporária. O comportamento relatado nesta documentação ainda precisa ser confrontado com fórmulas, scripts, exemplos reais anonimizados e resultados aprovados antes de virar código de domínio.

## Estado desta documentação

Esta documentação começou na Etapa 2. A Etapa 6 caracterizou e implementou exclusivamente a elegibilidade para acompanhamento operacional principal e o reconhecimento textual necessário para essa decisão.

Os conteúdos usam os seguintes estados de maturidade:

| Estado             | Significado                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Identificado       | O conceito ou capacidade existe, mas ainda não há comportamento suficiente para caracterização.                     |
| Relatado           | Comportamento descrito pela operação, ainda sem evidência extraída da planilha neste repositório.                   |
| A validar          | Padrão relatado com ressalva explícita, que não deve ser tratado como identificação definitiva.                     |
| Em caracterização  | Existem exemplos ou artefatos em análise, mas o comportamento ainda não foi confirmado.                             |
| Caracterizado      | O comportamento atual foi explicitado a partir da planilha ou de sua lógica transcrita, com cenários reproduzíveis. |
| Aprovado           | O responsável operacional confirmou que o comportamento deve ser preservado no novo sistema.                        |
| Princípio aprovado | Restrição de modelagem já aprovada, sem definir a implementação final.                                              |
| Implementado       | O comportamento existe no domínio de software.                                                                      |
| Verificado         | A implementação foi comparada com cenários aprovados e produziu o resultado esperado.                               |

Um comportamento pode ser caracterizado e ainda não ser aprovado como regra futura. Uma decisão arquitetural aprovada também não prova que uma regra operacional esteja caracterizada.

## Proveniência desta versão

Os itens marcados como `Relatado` têm como fonte o briefing operacional fornecido pelo Mestre para a Etapa 2 em 2026-09-26. A família `RULE-TRACK` marcada como `Caracterizado` usa a expressão da fórmula e os padrões textuais descritos pelo Mestre na Etapa 6 na mesma data, reproduzidos por testes automatizados do domínio.

Nenhum arquivo da planilha foi incorporado ao repositório. A caracterização da Etapa 6 limita-se ao comportamento da fórmula explicitamente descrito e aos casos reproduzidos nos testes. Nenhuma regra operacional foi marcada como `Aprovado`.

## Mapa dos documentos

| Necessidade                                                   | Fonte canônica                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| Entender os termos operacionais e suas diferenças             | [Glossário](glossary.md)                                    |
| Entender os campos do eTrack e do eComex                      | [Dicionário das fontes](source-data-dictionary.md)          |
| Consultar comportamentos e precedências relatados             | [Catálogo de regras](rule-catalog.md)                       |
| Consultar exemplos documentais para futura caracterização     | [Cenários de caracterização](characterization-scenarios.md) |
| Consultar lacunas que dependem de decisão ou evidência humana | [Questões em aberto](open-questions.md)                     |
| Consultar limites técnicos do domínio                         | [Visão arquitetural](../architecture/overview.md)           |
| Consultar decisões arquiteturais aprovadas                    | [ADRs](../adr/README.md)                                    |

## Ordem de leitura

1. Leia o glossário para preservar o vocabulário.
2. Consulte o dicionário para distinguir dados externos de conceitos do domínio.
3. Leia o catálogo para conhecer o comportamento atual relatado.
4. Use os cenários para validar a planilha e obter aprovação operacional.
5. Consulte as questões abertas antes de preencher qualquer lacuna.

## Convenções de rastreabilidade

- `TERM`: termo do glossário.
- `SRC-ETRACK`: campo do eTrack.
- `SRC-ECOMEX`: campo do eComex.
- `RULE`: comportamento ou princípio catalogado.
- `SCN`: cenário de caracterização.
- `Q`: questão de domínio em aberto.

Os identificadores permanecem estáveis mesmo quando títulos ou descrições forem refinados.

## Limites

- Os nomes de colunas das fontes são preservados exatamente como informados.
- Nomes externos não são automaticamente nomes do domínio.
- Um dado ausente não é igual a um dado não identificado.
- Evento, etapa, criticidade, desvio, alerta e inconsistência são dimensões diferentes.
- Questões abertas não são ADRs.
- Nenhum documento desta pasta define schema de banco, DTO, enum TypeScript ou contrato HTTP.

## Fluxo de atualização

1. Registrar nova evidência no cenário relacionado.
2. Atualizar o comportamento no catálogo quando a evidência for suficiente.
3. Atualizar o glossário ou o dicionário somente se a semântica tiver mudado.
4. Marcar a questão relacionada como resolvida e apontar para a fonte canônica.
5. Criar ADR apenas se surgir uma decisão arquitetural durável.
