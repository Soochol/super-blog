import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/infrastructure/db/PrismaClient';
import { createPipelineJob, getLatestPipelineStatus } from './service';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const category = body.category ?? '노트북';
  const makers = body.makers ?? ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'];

  const result = await createPipelineJob(db, { category, makers });

  if (result.conflict) {
    return NextResponse.json({ error: 'Pipeline already running' }, { status: 409 });
  }

  return NextResponse.json({ jobId: result.jobId, status: 'PENDING' });
}

export async function GET() {
  const status = await getLatestPipelineStatus(db);
  if (!status) return NextResponse.json(null);
  return NextResponse.json(status);
}
