import { describe, expect, it } from 'vitest'
import { determineDeviationLifecycle } from './determine-deviation-lifecycle.js'

describe('deviation lifecycle determination', () => {
  it('classifies a deviation without an end as open', () => {
    const input = { hasEnd: false } as const

    expect(determineDeviationLifecycle(input)).toEqual({
      lifecycle: 'OPEN',
      reasonCode: 'MISSING_END_MEANS_OPEN',
      evaluatedFacts: input,
      issues: [],
    })
  })

  it('classifies a deviation with an end as closed', () => {
    const input = { hasEnd: true } as const

    expect(determineDeviationLifecycle(input)).toEqual({
      lifecycle: 'CLOSED',
      reasonCode: 'END_PRESENT_MEANS_CLOSED',
      evaluatedFacts: input,
      issues: [],
    })
  })
})
