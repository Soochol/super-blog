import { PrismaAnalyticsTracker } from '@/infrastructure/analytics/PrismaAnalyticsTracker';
import { createCtaClickEvent } from '@/domains/analytics/domain/Event';

const mockCreate = jest.fn().mockResolvedValue({});
jest.mock('@/infrastructure/db/PrismaClient', () => ({
  prisma: {
    eventLog: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe('PrismaAnalyticsTracker', () => {
  const tracker = new PrismaAnalyticsTracker();

  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('does not throw when prisma.eventLog.create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB connection failed'));
    const event = createCtaClickEvent('product-1', 'product_detail', 'bottom', 'primary');

    await expect(tracker.trackEvent(event)).resolves.toBeUndefined();
  });

  it('trackEvent saves cta_click to EventLog', async () => {
    const event = createCtaClickEvent('product-1', 'product_detail', 'bottom', 'primary');

    await tracker.trackEvent(event);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        eventName: 'cta_click',
        payload: {
          product_id: 'product-1',
          page_type: 'product_detail',
          cta_position: 'bottom',
          cta_variant: 'primary',
        },
        timestamp: event.timestamp,
      },
    });
  });
});
