import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { AppModule } from './app.module'

describe('AppModule', () => {
  it('creates the NestJS application context', async () => {
    const application = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    })

    expect(application.get(AppModule)).toBeInstanceOf(AppModule)

    await application.close()
  })
})
