import { MetadataRoute } from 'next';
import { getCategories, getProductsByCategory } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const now = new Date();
  const categories = await getCategories();

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (
    await Promise.all(
      categories.map(async (cat) => {
        const products = await getProductsByCategory(cat.id);
        return products.map((p) => ({
          url: `${baseUrl}/${cat.id}/${p.id}`,
          lastModified: now,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      })
    )
  ).flat();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/laptop/rank/price`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/laptop/rank/weight`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/laptop/rank/premium`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/guide/gaming-laptop-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
  ];
}
