# Dicionário das fontes de dados

Este documento descreve o significado atualmente conhecido dos dados externos. Ele não define schemas Zod, DTOs, tabelas ou nomes de propriedades TypeScript.

Os campos e usos descritos foram fornecidos no briefing operacional de 2026-09-26. Nenhum arquivo real do eTrack ou eComex foi inspecionado nas Etapas 2, 3 e 4.

As Etapas 3 e 4 implementaram e verificaram contratos lógicos para linhas do eTrack e do eComex. Isso confirma o comportamento técnico do código, mas não caracteriza os formatos físicos nem as regras operacionais da ferramenta atual.

## Fluxo observado

```text
eTrack + eComex
  -> normalização
  -> correlação
  -> processamento
  -> estado operacional
  -> dashboard e controles
```

A camada `Processamento` da planilha concentra hoje o comportamento mais próximo do futuro domínio. O novo sistema deverá separar os dados recebidos das decisões derivadas.

## Áreas conceituais da planilha atual

| Área                  | Responsabilidade observada                                       | Situação nesta etapa                                                  |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Dashboard             | Apresentar indicadores e visão operacional.                      | Identificada, sem detalhamento de métricas.                           |
| Controle Pós-Registro | Acompanhar processos registrados e ainda não faturados.          | Parcialmente relatada.                                                |
| Controle de Desvios   | Apresentar e acompanhar desvios vindos principalmente do eComex. | Parcialmente relatada.                                                |
| Previsão de Débitos   | Projetar débitos operacionais.                                   | Apenas identificada.                                                  |
| Importação eComex     | Receber dados de desvios.                                        | Contrato lógico implementado e testado; formato físico não fornecido. |
| Importação eTrack     | Receber dados dos processos.                                     | Contrato lógico implementado e testado; formato físico não fornecido. |
| Configuração          | Manter parâmetros usados pelo processamento atual.               | Conteúdo ainda não inventariado.                                      |
| Processamento         | Transformar dados em estados, prioridades, alertas e controles.  | Principal referência para futura caracterização do domínio.           |

## eTrack

| ID             | Campo externo                 | Significado ou uso observado                                                                                       | Ainda não determinado                                                                     |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| SRC-ETRACK-001 | `Numero do Processo`          | Identificador interno do processo.                                                                                 | Formato, unicidade, estabilidade e cardinalidade.                                         |
| SRC-ETRACK-002 | `Referencia Cliente`          | Representa atualmente o embarque e é a principal referência observada na correlação com o eComex.                  | Se é chave definitiva, única ou suficiente.                                               |
| SRC-ETRACK-003 | `Data da Previsão de Chegada` | ETA usada no acompanhamento, criticidade e alertas.                                                                | Formato, fuso, ausência, correções e semântica sem horário.                               |
| SRC-ETRACK-004 | `Data Chegada`                | Evidência de chegada efetiva da carga.                                                                             | Formato, fuso e política para correções.                                                  |
| SRC-ETRACK-005 | `Via Transporte`              | Texto de origem usado para distinguir regras por modal.                                                            | Vocabulário possível e equivalência com `MODAL` do eComex.                                |
| SRC-ETRACK-006 | `Data Registro`               | Evidência de que o processo foi registrado. Retira o processo da fila principal e pode incluí-lo no pós-registro.  | Formato, fuso e precedência diante de dados conflitantes.                                 |
| SRC-ETRACK-007 | `Nº CE MERCANTE`              | Evidência de existência de Mercante em processos aplicáveis.                                                       | Formato, validade e relação exata com abertura e conferência.                             |
| SRC-ETRACK-008 | `Datas Originais`             | Presença válida é evidência de recebimento físico na política caracterizada da Etapa 13.                           | Estrutura, cardinalidade, significado de cada data e conversão para o fato de domínio.    |
| SRC-ETRACK-009 | `Observações`                 | Texto livre usado para identificar eventos, Mercante e situações documentais.                                      | Estrutura temporal, autoria e algoritmo exato de ordenação das evidências.                |
| SRC-ETRACK-010 | `House`                       | Referência documental cuja presença participa da heurística legado do original físico quando o modal é aéreo.      | Formato, cardinalidade, conversão segura para presença e papel na identidade do processo. |
| SRC-ETRACK-011 | `Master`                      | Referência documental do processo.                                                                                 | Formato, cardinalidade e relação com House e embarque.                                    |
| SRC-ETRACK-012 | `Agente`                      | Dado da fonte cuja ausência participa da heurística legado do original físico quando modal aéreo e House presente. | Significado de valor vazio, conversão segura para ausência e fonte autoritativa.          |
| SRC-ETRACK-013 | `Data do Faturamento`         | Evidência de faturamento, usada para delimitar o controle pós-registro.                                            | Formato, fuso e possíveis estados de correção ou cancelamento.                            |

### Contrato técnico executável da Etapa 3

O contrato canônico executável está em `apps/api/src/imports/etrack/etrack-contract.ts`. Seu consumidor atual é o normalizador específico do eTrack na mesma pasta.

Comportamentos técnicos implementados e verificados:

- `Numero do Processo` é o único cabeçalho obrigatório para que uma coleção de colunas represente uma fonte eTrack identificável nesta etapa;
- os demais cabeçalhos conhecidos são opcionais e suas células podem estar ausentes ou vazias;
- nomes de cabeçalho são reconhecidos exatamente como documentados, sem aliases, correção de caixa ou remoção de acentos;
- cabeçalhos adicionais são aceitos e os respectivos valores permanecem nos dados brutos da linha;
- `Numero do Processo`, `Referencia Cliente`, `House`, `Master` e `Nº CE MERCANTE` são projetados como texto e nunca como número;
- espaços externos são removidos dos campos textuais estruturados;
- `Observações` é preservado integralmente quando contém texto, incluindo espaços externos, acentuação, pontuação e quebras de linha; células compostas somente por espaços representam ausência técnica;
- datas lógicas distinguem ausência, data, data e hora e valor inválido;
- o contrato lógico reconhece somente representações ISO nesta etapa, preserva offsets recebidos e não cria horário nem converte fuso;
- `Aérea` e `Marítima` possuem representação técnica conhecida; outros textos de `Via Transporte` são preservados como desconhecidos e geram issue não fatal;
- cada resultado preserva fonte, versão da fonte, número da linha, registro bruto recebido, projeção normalizada e issues;
- erros esperados de dados são representados como issues, sem decidir se o lote será aceito total ou parcialmente.

Essas garantias têm estado `Implementado` e `Verificado` apenas para o contrato técnico. Elas não mudam para `Caracterizado` os significados relatados dos campos nem confirmam quais formatos uma exportação real produzirá.

## eComex

| ID             | Campo externo   | Significado ou uso observado                                                                   | Ainda não determinado                                                                                                    |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| SRC-ECOMEX-001 | `EMBARQUE`      | Principal referência atualmente usada para relacionar desvios ao embarque do eTrack.           | Se é chave definitiva, única ou suficiente.                                                                              |
| SRC-ECOMEX-002 | `MODAL`         | Modal informado no contexto do desvio.                                                         | Vocabulário possível e precedência em divergência com `Via Transporte`.                                                  |
| SRC-ECOMEX-003 | `DESCR_DESVIO`  | Descrição do desvio. Participa da classificação de impacto, mas pode ser insuficiente sozinha. | A normalização de impacto foi caracterizada na Etapa 10; catálogo completo e estabilidade dos textos permanecem abertos. |
| SRC-ECOMEX-004 | `INICIO`        | Início do desvio.                                                                              | Formato, fuso e participação em ordenação ou duplicidade.                                                                |
| SRC-ECOMEX-005 | `FIM`           | No comportamento atual, sua ausência indica desvio aberto.                                     | Semântica de valores inválidos, reabertura e divergência com conclusão.                                                  |
| SRC-ECOMEX-006 | `OBSERVACOES`   | Contexto textual do desvio. Pode alterar a classificação operacional de certas descrições.     | Seis padrões e sua precedência foram caracterizados na Etapa 10; outros conteúdos permanecem abertos.                    |
| SRC-ECOMEX-007 | `JUSTIFICATIVA` | Justificativa registrada para o desvio.                                                        | Uso atual no processamento e obrigatoriedade.                                                                            |
| SRC-ECOMEX-008 | `APONTADO_POR`  | Responsável pelo apontamento.                                                                  | Uso atual no domínio e formato de identificação.                                                                         |
| SRC-ECOMEX-009 | `CONCLUIDO_POR` | Responsável informado na conclusão.                                                            | Relação com `FIM` e tratamento de combinações inconsistentes.                                                            |
| SRC-ECOMEX-010 | `EXPORT_NOME`   | Campo de origem relacionado à exportação.                                                      | Significado operacional e participação em identidade ou correlação.                                                      |
| SRC-ECOMEX-011 | `INVOICE`       | Referência de fatura associada ao desvio.                                                      | Cardinalidade, formato e relação com processo e embarque.                                                                |

### Contrato técnico executável da Etapa 4

O contrato canônico executável está em `apps/api/src/imports/ecomex/ecomex-contract.ts`. Seu consumidor atual é o normalizador específico do eComex na mesma pasta.

Comportamentos técnicos implementados e verificados:

- `EMBARQUE` e `DESCR_DESVIO` são os cabeçalhos e valores mínimos exigidos pelo contrato lógico atual para reconhecer uma linha técnica do eComex;
- essa exigência não estabelece `EMBARQUE` como chave, não confirma o formato físico e permanece revisável quando existirem exportações reais;
- os demais cabeçalhos conhecidos são opcionais e suas células podem estar ausentes ou vazias;
- nomes de cabeçalho são reconhecidos exatamente como documentados, sem aliases, correção de caixa ou remoção de acentos;
- cabeçalhos adicionais são aceitos e os respectivos valores permanecem nos dados brutos da linha;
- `EMBARQUE` e `INVOICE` são projetados como texto e nunca como número;
- espaços externos são removidos dos campos textuais estruturados, sem alterar espaços internos, zeros, barras, hífens, prefixos ou sufixos;
- `DESCR_DESVIO` é preservado como texto, inclusive quando contém o prefixo `Desvio:`, sem classificação ou correspondência com catálogos;
- `OBSERVACOES` e `JUSTIFICATIVA` são preservadas integralmente quando contêm texto, incluindo espaços externos, acentuação, pontuação e quebras de linha;
- `INICIO` e `FIM` distinguem ausência, data, data e hora e valor inválido;
- o contrato lógico reconhece somente representações ISO nesta etapa, preserva offsets recebidos e não cria horário nem converte fuso;
- `FIM` ausente representa somente ausência técnica e não determina se um desvio está aberto;
- `AEREO` e `MARITIMO` possuem representação técnica conhecida específica do eComex; outros textos de `MODAL` são preservados como desconhecidos e geram issue não fatal;
- não existe conversão entre o vocabulário de modal do eComex e o do eTrack;
- `APONTADO_POR`, `CONCLUIDO_POR` e `EXPORT_NOME` permanecem textos da fonte, sem criação ou deduplicação de identidades;
- cada resultado preserva fonte, versão da fonte, número da linha, registro bruto recebido, projeção normalizada e issues;
- erros esperados de dados são representados como issues, sem decidir se o lote será aceito total ou parcialmente.

Essas garantias têm estado `Implementado` e `Verificado` apenas para o contrato técnico. Elas não mudam para `Caracterizado` os significados relatados dos campos, não confirmam quais formatos uma exportação real produzirá e não aprovam regras futuras de domínio.

## Correlação observada

O comportamento atual usa principalmente:

```text
eTrack.Referencia Cliente <-> eComex.EMBARQUE
```

Essa relação é uma observação da ferramenta atual. Ela não está aprovada como identidade canônica nem como chave persistente do novo sistema.

Antes de modelar correlação ou persistência, devem ser validados:

- unicidade dos dois campos;
- cardinalidade entre processo, embarque, Invoice, House e Master;
- variações de formatação;
- registros ausentes ou duplicados;
- comportamento quando uma fonte diverge da outra.

Consulte `Q-ID-001` e `Q-ID-002` em [questões abertas](open-questions.md).

## Normalização e interpretação

Na ferramenta atual, a identificação de eventos normaliza caixa, acentuação, pontuação, espaços e alguns artigos antes de procurar padrões nas observações.

Na arquitetura futura existem duas responsabilidades distintas:

1. A integração poderá normalizar aspectos técnicos, como encoding, espaços, cabeçalhos e formatos de data.
2. O domínio interpretará o significado operacional de eventos, desvios, exceções e documentos.

O algoritmo de normalização usado exclusivamente para reconhecer o evento operacional foi caracterizado na Etapa 7. A normalização de impacto de desvios foi caracterizada separadamente na Etapa 10. Nenhum deles se torna normalizador universal nem caracteriza os algoritmos textuais de Mercante, documentos ou outras famílias.

## Ausência, desconhecimento e inconsistência

Um valor vazio na fonte não define sozinho o significado de domínio. Conforme o campo e o contexto, ele pode representar:

- ausência esperada;
- dado ainda pendente;
- dado desconhecido;
- dimensão não aplicável;
- erro de origem;
- inconsistência entre fontes.

Essas possibilidades devem permanecer distintas durante a futura modelagem.
