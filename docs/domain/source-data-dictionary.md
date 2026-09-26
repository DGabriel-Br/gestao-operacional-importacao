# Dicionário das fontes de dados

Este documento descreve o significado atualmente conhecido dos dados externos. Ele não define schemas Zod, DTOs, tabelas ou nomes de propriedades TypeScript.

Os campos e usos descritos foram fornecidos no briefing operacional de 2026-09-26. Nenhum arquivo real do eTrack ou eComex foi inspecionado nesta etapa.

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

| Área                  | Responsabilidade observada                                       | Situação nesta etapa                                        |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Dashboard             | Apresentar indicadores e visão operacional.                      | Identificada, sem detalhamento de métricas.                 |
| Controle Pós-Registro | Acompanhar processos registrados e ainda não faturados.          | Parcialmente relatada.                                      |
| Controle de Desvios   | Apresentar e acompanhar desvios vindos principalmente do eComex. | Parcialmente relatada.                                      |
| Previsão de Débitos   | Projetar débitos operacionais.                                   | Apenas identificada.                                        |
| Importação eComex     | Receber dados de desvios.                                        | Campos conhecidos, formato físico não fornecido.            |
| Importação eTrack     | Receber dados dos processos.                                     | Campos conhecidos, formato físico não fornecido.            |
| Configuração          | Manter parâmetros usados pelo processamento atual.               | Conteúdo ainda não inventariado.                            |
| Processamento         | Transformar dados em estados, prioridades, alertas e controles.  | Principal referência para futura caracterização do domínio. |

## eTrack

| ID             | Campo externo                 | Significado ou uso observado                                                                                      | Ainda não determinado                                                      |
| -------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| SRC-ETRACK-001 | `Numero do Processo`          | Identificador interno do processo.                                                                                | Formato, unicidade, estabilidade e cardinalidade.                          |
| SRC-ETRACK-002 | `Referencia Cliente`          | Representa atualmente o embarque e é a principal referência observada na correlação com o eComex.                 | Se é chave definitiva, única ou suficiente.                                |
| SRC-ETRACK-003 | `Data da Previsão de Chegada` | ETA usada no acompanhamento, criticidade e alertas.                                                               | Formato, fuso, ausência, correções e semântica sem horário.                |
| SRC-ETRACK-004 | `Data Chegada`                | Evidência de chegada efetiva da carga.                                                                            | Formato, fuso e política para correções.                                   |
| SRC-ETRACK-005 | `Via Transporte`              | Texto de origem usado para distinguir regras por modal.                                                           | Vocabulário possível e equivalência com `MODAL` do eComex.                 |
| SRC-ETRACK-006 | `Data Registro`               | Evidência de que o processo foi registrado. Retira o processo da fila principal e pode incluí-lo no pós-registro. | Formato, fuso e precedência diante de dados conflitantes.                  |
| SRC-ETRACK-007 | `Nº CE MERCANTE`              | Evidência de existência de Mercante em processos aplicáveis.                                                      | Formato, validade e relação exata com abertura e conferência.              |
| SRC-ETRACK-008 | `Datas Originais`             | Fonte usada na situação do BL original físico.                                                                    | Estrutura, cardinalidade e significado de cada data.                       |
| SRC-ETRACK-009 | `Observações`                 | Texto livre usado para identificar eventos, Mercante e situações documentais.                                     | Estrutura temporal, autoria e algoritmo exato de ordenação das evidências. |
| SRC-ETRACK-010 | `House`                       | Referência documental e parte do padrão atualmente associado a alguns casos FEDEX.                                | Formato, cardinalidade e papel na identidade do processo.                  |
| SRC-ETRACK-011 | `Master`                      | Referência documental do processo.                                                                                | Formato, cardinalidade e relação com House e embarque.                     |
| SRC-ETRACK-012 | `Agente`                      | Agente associado ao processo e parte do padrão observado para candidatos FEDEX.                                   | Significado de valor vazio e fonte autoritativa.                           |
| SRC-ETRACK-013 | `Data do Faturamento`         | Evidência de faturamento, usada para delimitar o controle pós-registro.                                           | Formato, fuso e possíveis estados de correção ou cancelamento.             |

## eComex

| ID             | Campo externo   | Significado ou uso observado                                                                   | Ainda não determinado                                                   |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| SRC-ECOMEX-001 | `EMBARQUE`      | Principal referência atualmente usada para relacionar desvios ao embarque do eTrack.           | Se é chave definitiva, única ou suficiente.                             |
| SRC-ECOMEX-002 | `MODAL`         | Modal informado no contexto do desvio.                                                         | Vocabulário possível e precedência em divergência com `Via Transporte`. |
| SRC-ECOMEX-003 | `DESCR_DESVIO`  | Descrição do desvio. Participa da classificação de impacto, mas pode ser insuficiente sozinha. | Normalização exata, catálogo completo e estabilidade dos textos.        |
| SRC-ECOMEX-004 | `INICIO`        | Início do desvio.                                                                              | Formato, fuso e participação em ordenação ou duplicidade.               |
| SRC-ECOMEX-005 | `FIM`           | No comportamento atual, sua ausência indica desvio aberto.                                     | Semântica de valores inválidos, reabertura e divergência com conclusão. |
| SRC-ECOMEX-006 | `OBSERVACOES`   | Contexto textual do desvio. Pode alterar a classificação operacional de certas descrições.     | Padrões reconhecidos, ordem e precedência.                              |
| SRC-ECOMEX-007 | `JUSTIFICATIVA` | Justificativa registrada para o desvio.                                                        | Uso atual no processamento e obrigatoriedade.                           |
| SRC-ECOMEX-008 | `APONTADO_POR`  | Responsável pelo apontamento.                                                                  | Uso atual no domínio e formato de identificação.                        |
| SRC-ECOMEX-009 | `CONCLUIDO_POR` | Responsável informado na conclusão.                                                            | Relação com `FIM` e tratamento de combinações inconsistentes.           |
| SRC-ECOMEX-010 | `EXPORT_NOME`   | Campo de origem relacionado à exportação.                                                      | Significado operacional e participação em identidade ou correlação.     |
| SRC-ECOMEX-011 | `INVOICE`       | Referência de fatura associada ao desvio.                                                      | Cardinalidade, formato e relação com processo e embarque.               |

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

O algoritmo exato de normalização textual da planilha ainda precisa ser caracterizado. Não se deve inferir que toda normalização atual será preservada sem validação.

## Ausência, desconhecimento e inconsistência

Um valor vazio na fonte não define sozinho o significado de domínio. Conforme o campo e o contexto, ele pode representar:

- ausência esperada;
- dado ainda pendente;
- dado desconhecido;
- dimensão não aplicável;
- erro de origem;
- inconsistência entre fontes.

Essas possibilidades devem permanecer distintas durante a futura modelagem.
