import { Module } from '@nestjs/common'
import { OperationalSnapshotController } from './presentation/http/operational-assessment/operational-snapshot.controller'

@Module({ controllers: [OperationalSnapshotController] })
export class AppModule {}
