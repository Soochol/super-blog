import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const DEFAULT_SCHEDULE = {
  enabled: false,
  frequency: 'daily',
  hour: 3,
  minute: 0,
  dayOfWeek: null,
  category: '노트북',
  makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'],
};

export async function GET() {
  const schedule = await db.pipelineSchedule.findFirst();
  return NextResponse.json(schedule ?? DEFAULT_SCHEDULE);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existing = await db.pipelineSchedule.findFirst();

  const data = {
    enabled: body.enabled ?? false,
    frequency: body.frequency ?? 'daily',
    hour: body.hour ?? 3,
    minute: body.minute ?? 0,
    dayOfWeek: body.dayOfWeek ?? null,
    category: body.category ?? '노트북',
    makers: body.makers ?? [],
  };

  const schedule = existing
    ? await db.pipelineSchedule.update({ where: { id: existing.id }, data })
    : await db.pipelineSchedule.create({ data });

  return NextResponse.json(schedule);
}
