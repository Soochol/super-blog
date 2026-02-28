import { PrismaClient } from '@prisma/client';
import { PipelineParams } from '../cli/pipeline';

type RunFn = (params: PipelineParams, log: (msg: string) => void) => Promise<void>;

type JobInput = {
  id: string;
  category: string;
  makers: string[];
  listingUrls: string[];
};

export class PipelineRunner {
  constructor(
    private db: PrismaClient,
    private runPipeline: RunFn
  ) {}

  async run(job: JobInput): Promise<void> {
    await this.db.pipelineJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      await this.runPipeline(
        { category: job.category, makers: job.makers, listingUrls: job.listingUrls },
        async (message: string) => {
          await this.db.pipelineLog.create({
            data: { jobId: job.id, message },
          });
        }
      );

      await this.db.pipelineJob.update({
        where: { id: job.id },
        data: { status: 'DONE', completedAt: new Date() },
      });
    } catch (error) {
      await this.db.pipelineJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });
      await this.db.pipelineLog.create({
        data: { jobId: job.id, message: `FATAL: ${(error as Error).message}` },
      });
    }
  }
}
