import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, JobModelType } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: JobModelType) {}

  async createJob(job: Job): Promise<Job> {
    try {
      return await this.jobModel.create(job);
    } catch (error) {
      throw error;
    }
  }

  async save(job: Job) {
    try {
      await new this.jobModel(job).save();
    } catch (error) {
      throw error;
    }
  }
}
