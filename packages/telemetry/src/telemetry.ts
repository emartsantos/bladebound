export type ConsentState = 'pending' | 'granted' | 'denied';

export type TelemetryEventType =
  | 'session_start'
  | 'session_end'
  | 'feature_used'
  | 'milestone'
  | 'purchase'
  | 'error';

export interface TelemetryEvent {
  type: TelemetryEventType;
  sessionId: string;
  ts: number;
  properties?: Record<string, unknown>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface TelemetryTransport {
  send(events: TelemetryEvent[]): Promise<void>;
}

export interface TelemetryOptions {
  sessionId?: string;
  now?: () => number;
  batchSize?: number;
  transport?: TelemetryTransport;
  storage?: StorageLike;
  initialConsent?: ConsentState;
}

export interface TelemetrySummary {
  total: number;
  byType: Record<TelemetryEventType, number>;
  features: Record<string, number>;
  milestones: Record<string, number>;
  purchaseCount: number;
  purchaseValue: number;
  errorCount: number;
}

const CONSENT_KEY = 'premium-rpg-telemetry-consent';
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'auth', 'secret', 'email', 'phone',
  'name', 'username', 'deviceid', 'sessiontoken', 'creditcard',
]);

export function sanitizeProps(props?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

export function uuid(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class Telemetry {
  readonly sessionId: string;
  private readonly events: TelemetryEvent[] = [];
  private readonly now: () => number;
  private readonly batchSize: number;
  private readonly transport: TelemetryTransport;
  private consent: ConsentState;
  private readonly storage?: StorageLike;

  constructor(options: TelemetryOptions = {}) {
    this.sessionId = options.sessionId ?? uuid();
    this.now = options.now ?? Date.now;
    this.batchSize = options.batchSize ?? 20;
    this.transport = options.transport ?? { send: async () => {} };
    this.storage = options.storage;
    const saved = this.storage?.getItem(CONSENT_KEY) as ConsentState | null | undefined;
    this.consent = saved ?? options.initialConsent ?? 'pending';
  }

  getConsent(): ConsentState {
    return this.consent;
  }

  grantConsent(): void {
    this.consent = 'granted';
    this.storage?.setItem(CONSENT_KEY, 'granted');
  }

  denyConsent(): void {
    this.consent = 'denied';
    this.storage?.setItem(CONSENT_KEY, 'denied');
  }

  track(type: TelemetryEventType, properties?: Record<string, unknown>): boolean {
    if (this.consent !== 'granted') return false;
    this.events.push({
      type,
      sessionId: this.sessionId,
      ts: this.now(),
      properties: sanitizeProps(properties),
    });
    if (this.events.length >= this.batchSize) {
      void this.flush();
    }
    return true;
  }

  startSession(): boolean {
    return this.track('session_start');
  }

  endSession(durationMs: number): boolean {
    return this.track('session_end', { durationMs });
  }

  useFeature(feature: string, properties?: Record<string, unknown>): boolean {
    return this.track('feature_used', { feature, ...properties });
  }

  reachMilestone(name: string, properties?: Record<string, unknown>): boolean {
    return this.track('milestone', { milestone: name, ...properties });
  }

  logError(error: Error | string, context?: Record<string, unknown>): boolean {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    return this.track('error', { message, context, ...(stack ? { stack: String(stack).slice(0, 2000) } : {}) });
  }

  recordPurchase(productId: string, amount: number, currency = 'USD'): boolean {
    return this.track('purchase', { productId, amount, currency });
  }

  get pending(): number {
    return this.events.length;
  }

  async flush(): Promise<void> {
    if (this.events.length === 0 || this.consent !== 'granted') return;
    const batch = this.events.splice(0, this.batchSize);
    // Offline-safe: on transport failure the batch is pushed back for retry.
    try {
      await this.transport.send(batch);
    } catch {
      this.events.unshift(...batch);
    }
  }

  summarize(events: TelemetryEvent[] = this.events): TelemetrySummary {
    const summary: TelemetrySummary = {
      total: events.length,
      byType: { session_start: 0, session_end: 0, feature_used: 0, milestone: 0, purchase: 0, error: 0 },
      features: {},
      milestones: {},
      purchaseCount: 0,
      purchaseValue: 0,
      errorCount: 0,
    };
    for (const event of events) {
      summary.byType[event.type] += 1;
      if (event.type === 'feature_used') {
        const feature = String(event.properties?.feature ?? '');
        if (feature) summary.features[feature] = (summary.features[feature] ?? 0) + 1;
      } else if (event.type === 'milestone') {
        const name = String(event.properties?.milestone ?? '');
        if (name) summary.milestones[name] = (summary.milestones[name] ?? 0) + 1;
      } else if (event.type === 'purchase') {
        summary.purchaseCount += 1;
        summary.purchaseValue += Number(event.properties?.amount ?? 0);
      } else if (event.type === 'error') {
        summary.errorCount += 1;
      }
    }
    return summary;
  }

  get eventsSnapshot(): TelemetryEvent[] {
    return [...this.events];
  }
}