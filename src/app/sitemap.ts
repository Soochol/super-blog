import { MetadataRoute } from 'next';
import { getCategories, getProductsByCategory } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const categories = await getCategories();

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (
    await Promise.all(
      categories.map(async (cat) => {
        const products = await getProductsByCategory(cat.id);
        return products.map((p) => ({
          url: `${baseUrl}/${cat.id}/${p.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      })
    )
  ).flat();

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...categoryRoutes,
    ...productRoutes,
  ];
}
