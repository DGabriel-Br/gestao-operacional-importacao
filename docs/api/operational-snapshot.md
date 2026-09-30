# Snapshot operacional HTTP

Esta rota é um adaptador stateless provisório para linhas lógicas das fontes já decodificadas. Ela não recebe arquivos, CSV, bytes ou multipart e não persiste resultados.

## Rota

```text
POST /operational-assessment/snapshot
```

Execuções compreendidas retornam HTTP 200. O endpoint não cria recurso persistente.

## Request

```json
{
  "evaluationDate": "2026-09-29",
  "etrackRows": [
    {
      "sourceVersion": "etrack-export-2026-09-29",
      "rowNumber": 2,
      "rawData": {
        "Numero do Processo": "0101BC-0001-26"
      }
    }
  ],
  "ecomexRows": [
    {
      "sourceVersion": "ecomex-export-2026-09-29",
      "rowNumber": 2,
      "rawData": {
        "EMBARQUE": "420001/2026",
        "DESCR_DESVIO": "Preço divergente"
      }
    }
  ]
}
```

`evaluationDate` deve ser uma data civil existente no formato exato `YYYY-MM-DD`. Date-time, timezone, espaços, `DD/MM/YYYY`, ausência e datas impossíveis são rejeitados.

Cada coleção deve ser um array. Cada linha deve possuir `sourceVersion` textual, `rowNumber` numérico e `rawData` como objeto não nulo e não array. O adaptador não faz coerção nem valida o significado dos campos internos de `rawData`; essa responsabilidade continua nos importadores e projeções existentes.

## Contrato HTTP inválido

Um body estruturalmente inválido retorna HTTP 400:

```json
{
  "status": "bad_request",
  "issues": [
    {
      "path": "evaluationDate",
      "code": "INVALID_EVALUATION_DATE"
    }
  ]
}
```

Problemas independentes são acumulados quando isso pode ser feito sem interpretar a fonte.

## Snapshot ready

Uma execução completa retorna HTTP 200 e preserva warnings, entries e diagnostics:

```json
{
  "status": "ready",
  "evaluationDate": "2026-09-29",
  "warnings": {
    "etrack": [],
    "ecomex": []
  },
  "batch": {
    "entries": [],
    "diagnostics": []
  }
}
```

## Fonte inválida

Um contrato HTTP válido pode conter uma linha tecnicamente inválida. Nesse caso, o caso de uso foi executado corretamente e retorna HTTP 200:

```json
{
  "status": "invalid_source_data",
  "evaluationDate": "2026-09-29",
  "failures": {
    "etrack": [],
    "ecomex": []
  }
}
```

As falhas preservam trace e issues técnicos e de projeção. O response não ecoa o `rawData` completo recebido.

## Fora do escopo

- upload e multipart;
- parser CSV;
- bytes, BOM, charset ou decoding;
- reparo de `U+FFFD` ou mojibake;
- persistência, histórico ou banco;
- autenticação e autorização;
- versionamento e limites de tamanho.
