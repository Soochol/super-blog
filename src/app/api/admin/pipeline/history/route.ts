import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET() {
  const jobs = await db.pipelineJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, status: true, triggeredBy: true,
      createdAt: true, startedAt: true, completedAt: true,
    },
  });
  return NextResponse.json(jobs);
}
