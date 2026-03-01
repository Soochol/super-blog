import { ComponentType } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GamingLaptopGuide from './gaming-laptop-guide';

const GUIDES: Record<string, { title: string; description: string; component: ComponentType }> = {
  'gaming-laptop-guide': {
    title: '게이밍 노트북 완벽 가이드 2026 | Super Blog',
    description: 'GPU, CPU, 디스플레이까지 게이밍 노트북 선택의 모든 것을 알려드립니다.',
    component: GamingLaptopGuide,
  },
};

export async function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return { title: 'Not Found' };
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) notFound();

  const GuideContent = guide.component;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-black text-black mb-8 bg-neo-orange inline-block px-4 py-2 border-4 border-black shadow-hard">
        {guide.title.split('|')[0].trim()}
      </h1>
      <GuideContent />
    </div>
  );
}
