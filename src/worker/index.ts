import 'dotenv/config';
import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { PipelineRunner } from './PipelineRunner';
import { runPipeline } from '../cli/pipeline';

const db = new PrismaClient();
const runner = new PipelineRunner(db, runPipeline);

let scheduledTask: cron.ScheduledTask | null = null;

async function registerScheduler(): Promise<void> {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  const schedule = await db.pipelineSchedule.findFirst();
  if (!schedule?.enabled) return;

  const { hour, minute, dayOfWeek, frequency, category, makers } = schedule;
  const cronExpr =
    frequency === 'weekly' && dayOfWeek != null
      ? `${minute} ${hour} * * ${dayOfWeek}`
      : `${minute} ${hour} * * *`;

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] Triggering pipeline at ${new Date().toISOString()}`);
    await db.pipelineJob.create({
      data: { category, makers, triggeredBy: 'SCHEDULER' },
    });
  });

  console.log(`[scheduler] Registered: ${cronExpr}`);
}

async function pollLoop(): Promise<void> {
  console.log('[worker] Starting poll loop...');
  let lastScheduleCheck = 0;

  while (true) {
    if (Date.now() - lastScheduleCheck > 60_000) {
      await registerScheduler();
      lastScheduleCheck = Date.now();
    }

    const job = await db.pipelineJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (job) {
      console.log(`[worker] Running job ${job.id} (${job.triggeredBy})`);
      await runner.run({
        id: job.id,
        category: job.category,
        makers: job.makers,
        listingUrls: [],
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

pollLoop().catch((e) => {
  console.error('[worker] Fatal error:', e);
  process.exit(1);
});
