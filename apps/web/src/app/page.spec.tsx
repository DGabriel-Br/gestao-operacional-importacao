import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('identifies the project without presenting business functionality', () => {
    const markup = renderToStaticMarkup(HomePage())

    expect(markup).toContain('Gestão Operacional de Importação')
    expect(markup).toContain('Estrutura inicial do projeto.')
  })
})
