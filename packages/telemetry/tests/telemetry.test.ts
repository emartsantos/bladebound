import { describe, expect, it } from 'vitest';
import { Telemetry, sanitizeProps } from '../src/telemetry';

describe('sanitizeProps', () => {
  it('strips sensitive keys case-insensitively', () => {
    const out = sanitizeProps({ feature: 'combat', token: 'abc', Auth: 'x', deviceId: 'y' });
    expect(out).toEqual({ feature: 'combat' });
  });

  it('keeps non-sensitive keys', () => {
    const out = sanitizeProps({ gold: 10, kills: 2 });
    expect(out.gold).toBe(10);
    expect(out.kills).toBe(2);
  });
});

describe('Telemetry consent', () => {
  it('does not record events before consent is granted', () => {
    const telemetry = new Telemetry({ initialConsent: 'pending' });
    expect(telemetry.track('feature_used', { feature: 'crafting' })).toBe(false);
    expect(telemetry.pending).toBe(0);
  });

  it('records events after consent is granted', () => {
    const telemetry = new Telemetry({ initialConsent: 'pending' });
    telemetry.grantConsent();
    expect(telemetry.track('feature_used', { feature: 'crafting' })).toBe(true);
    expect(telemetry.pending).toBe(1);
  });

  it('denyConsent stops recording and persists', () => {
    const storage = {
      getItem: (_key: string) => null as string | null,
      setItem: () => {},
    };
    const telemetry = new Telemetry({ initialConsent: 'granted', storage });
    telemetry.denyConsent();
    expect(telemetry.getConsent()).toBe('denied');
    expect(telemetry.track('feature_used', { feature: 'combat' })).toBe(false);
  });
});

describe('Telemetry event capture', () => {
  it('captures feature usage with session and timestamp', () => {
    let tick = 0;
    const telemetry = new Telemetry({ now: () => tick, sessionId: 'sess-1' });
    telemetry.grantConsent();
    tick = 100;
    telemetry.useFeature('combat', { kills: 1 });
    telemetry.useFeature('combat');
    telemetry.useFeature('crafting');
    expect(telemetry.pending).toBe(3);
    const snapshot = telemetry.eventsSnapshot;
    expect(snapshot[0]).toMatchObject({ type: 'feature_used', sessionId: 'sess-1', ts: 100 });
    expect(snapshot[0].properties).toMatchObject({ feature: 'combat', kills: 1 });
  });

  it('tracks sessions, milestones, purchases and errors', () => {
    const telemetry = new Telemetry({});
    telemetry.grantConsent();
    telemetry.startSession();
    telemetry.endSession(300_000);
    telemetry.reachMilestone('level_10');
    telemetry.recordPurchase('cosmetic_v1', 4.99);
    telemetry.logError('boom', { zone: 'ashlands' });
    const summary = telemetry.summarize();
    expect(summary.total).toBe(5);
    expect(summary.byType.session_start).toBe(1);
    expect(summary.byType.session_end).toBe(1);
    expect(summary.byType.milestone).toBe(1);
    expect(summary.byType.purchase).toBe(1);
    expect(summary.byType.error).toBe(1);
    expect(summary.purchaseCount).toBe(1);
    expect(summary.purchaseValue).toBe(4.99);
    expect(summary.errorCount).toBe(1);
  });

  it('summarizes feature and milestone counts', () => {
    const telemetry = new Telemetry({});
    telemetry.grantConsent();
    telemetry.useFeature('mining', {});
    telemetry.useFeature('mining', {});
    telemetry.useFeature('smithing', {});
    telemetry.reachMilestone('skill_50');
    const summary = telemetry.summarize();
    expect(summary.features).toEqual({ mining: 2, smithing: 1 });
    expect(summary.milestones).toEqual({ skill_50: 1 });
  });
});

describe('Telemetry batching and flush', () => {
  it('flushes when the batch size is reached', async () => {
    const sent: unknown[][] = [];
    const telemetry = new Telemetry({
      batchSize: 3,
      transport: { send: async (events) => { sent.push(events); } },
    });
    telemetry.grantConsent();
    telemetry.useFeature('a', {});
    expect(telemetry.pending).toBe(1);
    telemetry.useFeature('b', {});
    telemetry.useFeature('c', {});
    expect(sent).toHaveLength(1);
    expect(sent[0]).toHaveLength(3);
  });

  it('returns retained batch on transport failure (offline-safe)', async () => {
    const failing: Telemetry[] = [];
    const telemetry = new Telemetry({
      batchSize: 2,
      transport: { send: async () => { throw new Error('offline'); } },
    });
    telemetry.grantConsent();
    telemetry.useFeature('a', {});
    telemetry.useFeature('b', {});
    await telemetry.flush();
    expect(telemetry.pending).toBe(2);
    void failing;
  });

  it('flush sends nothing when consent is denied', async () => {
    let calls = 0;
    const telemetry = new Telemetry({
      initialConsent: 'denied',
      transport: { send: async () => { calls += 1; } },
    });
    await telemetry.flush();
    expect(calls).toBe(0);
  });
});