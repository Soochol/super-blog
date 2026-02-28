'use server';

import { PrismaAnalyticsTracker } from '@/infrastructure/analytics/PrismaAnalyticsTracker';
import { createCtaClickEvent } from '@/domains/analytics/domain/Event';

const tracker = new PrismaAnalyticsTracker();

export async function trackCtaClick(
  productId: string,
  pageType: 'product_detail' | 'comparison' | 'category',
  ctaPosition: 'top' | 'middle' | 'bottom',
  ctaVariant: string,
): Promise<void> {
  const event = createCtaClickEvent(productId, pageType, ctaPosition, ctaVariant);
  await tracker.trackEvent(event);
}
