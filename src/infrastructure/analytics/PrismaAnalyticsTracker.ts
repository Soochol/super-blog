import { AnalyticsTracker } from '@/domains/analytics/domain/ports/AnalyticsTracker';
import { TrackingEvent } from '@/domains/analytics/domain/Event';
import { prisma } from '@/infrastructure/db/PrismaClient';

export class PrismaAnalyticsTracker implements AnalyticsTracker {
  async trackEvent(event: TrackingEvent): Promise<void> {
    await prisma.eventLog.create({
      data: {
        eventName: event.eventName,
        payload: event.payload,
        timestamp: event.timestamp,
      },
    });
  }
}
