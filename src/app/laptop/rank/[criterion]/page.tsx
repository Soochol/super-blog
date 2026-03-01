import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/infrastructure/db/PrismaClient';

const CRITERIA = {
  price: { label: '가성비 (저가순)', orderBy: { price: 'asc' } as const, color: 'bg-neo-green' },
  weight: { label: '휴대성 (경량순)', orderBy: { weight: 'asc' } as const, color: 'bg-neo-blue' },
  premium: { label: '프리미엄 (고가순)', orderBy: { price: 'desc' } as const, color: 'bg-neo-pink' },
} as const;

type Criterion = keyof typeof CRITERIA;

export async function generateStaticParams() {
  return (Object.keys(CRITERIA) as Criterion[]).map((criterion) => ({ criterion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ criterion: string }>;
}): Promise<Metadata> {
  const { criterion } = await params;
  if (!(criterion in CRITERIA)) return { title: 'Not Found' };
  const { label } = CRITERIA[criterion as Criterion];
  return {
    title: `노트북 랭킹 - ${label} | Super Blog`,
    description: `${label} 기준 노트북 랭킹 TOP 20`,
  };
}

export default async function RankPage({ params }: { params: Promise<{ criterion: string }> }) {
  const { criterion } = await params;
  if (!(criterion in CRITERIA)) notFound();

  const { label, orderBy, color } = CRITERIA[criterion as Criterion];

  const products = await prisma.product.findMany({
    orderBy,
    take: 20,
    select: {
      slug: true,
      maker: true,
      model: true,
      price: true,
      weight: true,
      imageUrl: true,
      categoryId: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className={`text-4xl font-black text-black inline-block px-4 py-2 border-4 border-black shadow-hard ${color} mb-4`}>
          노트북 랭킹
        </h1>
        <p className="text-xl font-black text-black">{label}</p>
      </div>

      {/* criterion 탭 */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {(Object.entries(CRITERIA) as [Criterion, (typeof CRITERIA)[Criterion]][]).map(([key, val]) => (
          <Link
            key={key}
            href={`/laptop/rank/${key}`}
            className={`px-4 py-2 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg transition-all ${key === criterion ? val.color : 'bg-white'}`}
          >
            {val.label}
          </Link>
        ))}
      </div>

      <ol className="space-y-4">
        {products.map((p, i) => (
          <li key={p.slug}>
            <Link
              href={p.categoryId ? `/${p.categoryId}/${p.slug}` : '#'}
              className="flex items-center gap-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg transition-all p-4"
            >
              <span className={`text-2xl font-black w-10 h-10 flex items-center justify-center border-4 border-black ${i < 3 ? 'bg-neo-yellow' : 'bg-white'}`}>
                {i + 1}
              </span>
              {p.imageUrl && (
                <img src={p.imageUrl} alt={`${p.maker} ${p.model}`} className="w-16 h-16 object-contain" />
              )}
              <div className="flex-1">
                <p className="font-black text-black text-lg">{p.maker} {p.model}</p>
                <p className="font-bold text-black">{p.price.toLocaleString()}원 · {p.weight}kg</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
