import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('domain package boundary', () => {
  it('has no runtime dependencies', async () => {
    const packageJsonUrl = new URL('../package.json', import.meta.url)
    const packageJson = JSON.parse(await readFile(packageJsonUrl, 'utf8')) as {
      dependencies?: Record<string, string>
    }

    expect(packageJson.dependencies ?? {}).toEqual({})
  })
})
