import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/PrismaClient';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { maker: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      slug: true,
      maker: true,
      model: true,
      imageUrl: true,
      categoryId: true,
    },
    take: 8,
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.slug,
      name: `${p.maker} ${p.model}`,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
    }))
  );
}
