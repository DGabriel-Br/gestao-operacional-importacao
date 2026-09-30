'use client'

import { type FormEvent, useState } from 'react'
import {
  requestOperationalSnapshot,
  type OperationalSnapshotHttpRequest,
} from './operational-snapshot-client'
import type {
  BadRequestOperationalSnapshotHttpResponse,
  InvalidSourceDataOperationalSnapshotHttpResponse,
  OperationalSnapshotHttpDiagnostic,
  OperationalSnapshotHttpFailure,
  OperationalSnapshotHttpResponse,
  OperationalSnapshotHttpWarning,
  ReadyOperationalSnapshotHttpResponse,
} from './operational-snapshot-contract'
import { parseOperationalSnapshotSourceInputs } from './parse-source-inputs'
import { projectOperationalSnapshotRows } from './project-snapshot-rows'

type RunState = 'idle' | 'submitting' | 'completed' | 'error'

interface JsonFieldErrors {
  readonly etrackRows?: 'INVALID_JSON'
  readonly ecomexRows?: 'INVALID_JSON'
}

export function OperationalSnapshotPage() {
  const [evaluationDate, setEvaluationDate] = useState('')
  const [etrackRowsText, setEtrackRowsText] = useState('[]')
  const [ecomexRowsText, setEcomexRowsText] = useState('[]')
  const [runState, setRunState] = useState<RunState>('idle')
  const [jsonErrors, setJsonErrors] = useState<JsonFieldErrors>({})
  const [response, setResponse] = useState<
    OperationalSnapshotHttpResponse | undefined
  >()
  const [requestError, setRequestError] = useState<string | undefined>()

  async function submitSnapshot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedInputs = parseOperationalSnapshotSourceInputs({
      etrackRowsText,
      ecomexRowsText,
    })
    if (parsedInputs.status === 'invalid') {
      setJsonErrors(parsedInputs.errors)
      setResponse(undefined)
      setRequestError(undefined)
      setRunState('idle')
      return
    }

    const request: OperationalSnapshotHttpRequest = {
      evaluationDate,
      etrackRows: parsedInputs.etrackRows,
      ecomexRows: parsedInputs.ecomexRows,
    }

    setJsonErrors({})
    setRequestError(undefined)
    setRunState('submitting')

    try {
      const nextResponse = await requestOperationalSnapshot(request)
      setResponse(nextResponse)
      setRunState('completed')
    } catch (error) {
      setResponse(undefined)
      setRequestError(
        error instanceof Error
          ? error.message
          : 'Falha desconhecida ao executar o snapshot.',
      )
      setRunState('error')
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Gestão Operacional de Importação</p>
        <h1>Snapshot Operacional</h1>
        <p>
          Interface técnica provisória para executar e inspecionar linhas
          lógicas já decodificadas.
        </p>
      </header>

      <section className="panel" aria-labelledby="input-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Entrada</p>
            <h2 id="input-heading">Fontes lógicas</h2>
          </div>
          <p>Informe a data e os arrays JSON sem alterar os dados de origem.</p>
        </div>

        <form onSubmit={submitSnapshot} className="snapshot-form">
          <div className="date-field">
            <label htmlFor="evaluation-date">Data de avaliação</label>
            <input
              id="evaluation-date"
              name="evaluationDate"
              type="date"
              value={evaluationDate}
              onChange={(event) => setEvaluationDate(event.target.value)}
              required
              disabled={runState === 'submitting'}
            />
            <span className="field-hint">Formato enviado: YYYY-MM-DD</span>
          </div>

          <div className="source-grid">
            <JsonSourceField
              id="etrack-rows"
              label="Linhas eTrack em JSON"
              value={etrackRowsText}
              onChange={setEtrackRowsText}
              error={jsonErrors.etrackRows}
              disabled={runState === 'submitting'}
            />
            <JsonSourceField
              id="ecomex-rows"
              label="Linhas eComex em JSON"
              value={ecomexRowsText}
              onChange={setEcomexRowsText}
              error={jsonErrors.ecomexRows}
              disabled={runState === 'submitting'}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={runState === 'submitting'}>
              {runState === 'submitting'
                ? 'Executando snapshot...'
                : 'Executar snapshot'}
            </button>
            <span aria-live="polite" className="run-state">
              {runState === 'idle' && 'Aguardando execução.'}
              {runState === 'submitting' && 'Processando dados informados.'}
              {runState === 'completed' && 'Execução concluída.'}
              {runState === 'error' && 'A execução não foi concluída.'}
            </span>
          </div>
        </form>
      </section>

      <section className="panel" aria-labelledby="result-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Saída</p>
            <h2 id="result-heading">Resultado</h2>
          </div>
          <p>O Web apresenta os códigos recebidos sem recalcular decisões.</p>
        </div>

        {runState === 'idle' && response === undefined && (
          <EmptyResult message="Execute um snapshot para visualizar o resultado." />
        )}
        {runState === 'submitting' && (
          <EmptyResult message="A API está avaliando o snapshot." />
        )}
        {runState === 'error' && requestError !== undefined && (
          <div className="status-card status-error" role="alert">
            <strong>Erro de rede ou servidor</strong>
            <span>{requestError}</span>
          </div>
        )}
        {runState === 'completed' && response?.status === 'ready' && (
          <ReadyResult response={response} />
        )}
        {runState === 'completed' &&
          response?.status === 'invalid_source_data' && (
            <InvalidSourceDataResult response={response} />
          )}
        {runState === 'completed' && response?.status === 'bad_request' && (
          <BadRequestResult response={response} />
        )}
      </section>
    </main>
  )
}

interface JsonSourceFieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly error: 'INVALID_JSON' | undefined
  readonly disabled: boolean
}

function JsonSourceField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: JsonSourceFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="json-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        disabled={disabled}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
      />
      {error !== undefined ? (
        <span id={errorId} className="field-error" role="alert">
          JSON sintaticamente inválido.
        </span>
      ) : (
        <span className="field-hint">Informe um array JSON.</span>
      )}
    </div>
  )
}

function EmptyResult({ message }: { readonly message: string }) {
  return <div className="empty-result">{message}</div>
}

function ReadyResult({
  response,
}: {
  readonly response: ReadyOperationalSnapshotHttpResponse
}) {
  const rows = projectOperationalSnapshotRows(response.batch.entries)

  return (
    <div className="result-stack">
      <div className="status-card status-ready">
        <strong>Snapshot pronto</strong>
        <span>Data de avaliação: {response.evaluationDate}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyResult message="Nenhum processo eTrack foi informado." />
      ) : (
        <div className="table-scroll">
          <table>
            <caption>Processos avaliados na ordem recebida</caption>
            <thead>
              <tr>
                <th scope="col">Processo</th>
                <th scope="col">Referência Cliente</th>
                <th scope="col">Resultado</th>
                <th scope="col">Etapa</th>
                <th scope="col">Criticidade</th>
                <th scope="col">Alerta</th>
                <th scope="col">Desvios Impeditivos</th>
                <th scope="col">Desvios Não Impeditivos</th>
                <th scope="col">Original Digital</th>
                <th scope="col">Original Físico</th>
                <th scope="col">Mercante</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.index}>
                  <td>{displayValue(row.processNumber)}</td>
                  <td>{displayValue(row.customerReference)}</td>
                  <td>
                    <strong>{row.resultLabel}</strong>
                    {row.reasonCode !== undefined && (
                      <small>{row.reasonCode}</small>
                    )}
                  </td>
                  <td>{displayValue(row.stage)}</td>
                  <td>{displayValue(row.criticality)}</td>
                  <td>{displayValue(row.alert)}</td>
                  <td>{displayValue(row.blockingDeviationCount)}</td>
                  <td>{displayValue(row.nonBlockingDeviationCount)}</td>
                  <td>{displayValue(row.digitalOriginal)}</td>
                  <td>{displayValue(row.physicalOriginal)}</td>
                  <td>{displayValue(row.mercante)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WarningSection
        title="Warnings eTrack"
        warnings={response.warnings.etrack}
      />
      <WarningSection
        title="Warnings eComex"
        warnings={response.warnings.ecomex}
      />
      <DiagnosticSection diagnostics={response.batch.diagnostics} />
    </div>
  )
}

function WarningSection({
  title,
  warnings,
}: {
  readonly title: string
  readonly warnings: readonly OperationalSnapshotHttpWarning[]
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {warnings.length === 0 ? (
        <p className="muted">Nenhum warning.</p>
      ) : (
        <ul className="detail-list">
          {warnings.map((warning) => (
            <li key={`${warning.index}-${warning.trace.rowNumber}`}>
              <strong>Linha {warning.trace.rowNumber}</strong>
              <span>
                {warning.issues.map((issue) => issue.code).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DiagnosticSection({
  diagnostics,
}: {
  readonly diagnostics: readonly OperationalSnapshotHttpDiagnostic[]
}) {
  return (
    <section className="detail-section">
      <h3>Diagnósticos do lote</h3>
      {diagnostics.length === 0 ? (
        <p className="muted">Nenhum diagnóstico.</p>
      ) : (
        <ul className="detail-list">
          {diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.code}-${index}`}>
              <strong>{diagnostic.code}</strong>
              {diagnostic.legacyCorrelationKey !== undefined && (
                <span>Chave legado: {diagnostic.legacyCorrelationKey}</span>
              )}
              {diagnostic.references !== undefined && (
                <span>
                  Referências:{' '}
                  {diagnostic.references
                    .map((reference) => reference.customerReference)
                    .join(', ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function InvalidSourceDataResult({
  response,
}: {
  readonly response: InvalidSourceDataOperationalSnapshotHttpResponse
}) {
  const failures = [
    ...response.failures.etrack.map((failure) => ({
      source: 'eTrack',
      failure,
    })),
    ...response.failures.ecomex.map((failure) => ({
      source: 'eComex',
      failure,
    })),
  ]

  return (
    <div className="result-stack">
      <div className="status-card status-warning">
        <strong>Dados de fonte inválidos</strong>
        <span>
          A requisição foi compreendida, mas nenhum snapshot completo foi
          produzido.
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <caption>Falhas técnicas ou de projeção</caption>
          <thead>
            <tr>
              <th scope="col">Fonte</th>
              <th scope="col">Linha</th>
              <th scope="col">Issue code</th>
            </tr>
          </thead>
          <tbody>
            {failures.flatMap(({ source, failure }) =>
              failureRows(source, failure),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function failureRows(source: string, failure: OperationalSnapshotHttpFailure) {
  return [...failure.importIssues, ...failure.projectionIssues].map(
    (issue, issueIndex) => (
      <tr key={`${source}-${failure.index}-${issueIndex}-${issue.code}`}>
        <td>{source}</td>
        <td>{failure.trace.rowNumber}</td>
        <td>{issue.code}</td>
      </tr>
    ),
  )
}

function BadRequestResult({
  response,
}: {
  readonly response: BadRequestOperationalSnapshotHttpResponse
}) {
  return (
    <div className="result-stack">
      <div className="status-card status-error">
        <strong>Contrato HTTP inválido</strong>
        <span>Revise os campos indicados pela API.</span>
      </div>
      <ul className="detail-list">
        {response.issues.map((issue, index) => (
          <li key={`${issue.path}-${issue.code}-${index}`}>
            <strong>{issue.path}</strong>
            <span>{issue.code}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function displayValue(value: string | number | undefined): string {
  return value === undefined ? '-' : String(value)
}
