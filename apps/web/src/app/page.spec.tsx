import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the technical operational snapshot form', () => {
    const markup = renderToStaticMarkup(HomePage())

    expect(markup).toContain('Snapshot Operacional')
    expect(markup).toContain('Data de avaliação')
    expect(markup).toContain('Linhas eTrack em JSON')
    expect(markup).toContain('Linhas eComex em JSON')
    expect(markup).toContain('Executar snapshot')
    expect(markup).toContain('Resultado')
  })
})
