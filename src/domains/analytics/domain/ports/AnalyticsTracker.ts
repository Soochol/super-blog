import { TrackingEvent } from '../Event';

export interface AnalyticsTracker {
    trackEvent(event: TrackingEvent): Promise<void>;
}
