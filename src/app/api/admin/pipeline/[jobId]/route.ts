import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await db.pipelineJob.findUnique({
    where: { id: jobId },
    include: { logs: { orderBy: { createdAt: 'asc' } } },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...job, logs: job.logs.map((l) => l.message) });
}
