import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReportMongoRepoProvider } from '@dating/repositories';
import { ActionModule } from '@modules/action';

import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report, ReportSchema } from './entities';

@Module({
  imports: [MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]), ActionModule],
  controllers: [ReportController],
  providers: [ReportService, ReportMongoRepoProvider],
  exports: [ReportMongoRepoProvider],
})
export class ReportModule {}
