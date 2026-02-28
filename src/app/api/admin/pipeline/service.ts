import { PrismaClient } from '@prisma/client';

type CreateJobInput = { category: string; makers: string[] };

export async function createPipelineJob(
  db: PrismaClient,
  input: CreateJobInput
): Promise<{ conflict: boolean; jobId?: string }> {
  const running = await db.pipelineJob.findFirst({
    where: { status: { in: ['PENDING', 'RUNNING'] } },
  });

  if (running) return { conflict: true };

  const job = await db.pipelineJob.create({
    data: { category: input.category, makers: input.makers, triggeredBy: 'MANUAL' },
  });

  return { conflict: false, jobId: job.id };
}

export async function getLatestPipelineStatus(db: PrismaClient) {
  const job = await db.pipelineJob.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { logs: { orderBy: { createdAt: 'asc' }, take: 100 } },
  });

  if (!job) return null;

  return {
    id: job.id,
    status: job.status,
    triggeredBy: job.triggeredBy,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    logs: job.logs.map((l) => l.message),
  };
}
