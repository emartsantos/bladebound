import { describe, it, expect } from 'vitest';
import {
  auditSystemContract,
  runMobileApiAudit,
  buildEndpointUrl,
  validateApiResponse,
  dispatchApiRequest,
  auditMobileFeature,
  auditSharedLogic,
} from '../src/mobile';
import type {
  MobileApiSystem,
  MobileApiContract,
} from '@premium-rpg/shared-types';

// ─── CONTRACT AUDIT ─────────────────────────────────────────────

const mobileReadyContract: MobileApiContract = {
  system: 'inventory',
  stateRetrievable: true,
  mutable: true,
  transports: ['rest'],
  requiresDom: false,
  endpoints: ['/api/inventory'],
  sharedFormulas: true,
  sharedTypes: true,
  sharedValidation: true,
};

describe('auditSystemContract', () => {
  it('passes a mobile-ready contract', () => {
    const item = auditSystemContract('inventory', mobileReadyContract);
    expect(item.passed).toBe(true);
    expect(item.failures).toHaveLength(0);
  });

  it('fails DOM-dependent contract', () => {
    const item = auditSystemContract('inventory', {
      ...mobileReadyContract,
      requiresDom: true,
    });
    expect(item.passed).toBe(false);
    expect(item.failures).toContain('Requires DOM to obtain state');
  });

  it('fails non-retrievable contract', () => {
    const item = auditSystemContract('inventory', {
      ...mobileReadyContract,
      stateRetrievable: false,
    });
    expect(item.passed).toBe(false);
  });

  it('fails when no transports', () => {
    const item = auditSystemContract('inventory', {
      ...mobileReadyContract,
      transports: [],
    });
    expect(item.passed).toBe(false);
  });

  it('fails when no endpoints', () => {
    const item = auditSystemContract('inventory', {
      ...mobileReadyContract,
      endpoints: [],
    });
    expect(item.passed).toBe(false);
  });
});

// ─── FULL AUDIT ────────────────────────────────────────────────

describe('runMobileApiAudit', () => {
  it('audits all provided systems', () => {
    const contracts: Partial<Record<MobileApiSystem, MobileApiContract>> = {
      inventory: mobileReadyContract,
      player_state: {
        system: 'player_state',
        stateRetrievable: true,
        mutable: false,
        transports: ['rest'],
        requiresDom: false,
        endpoints: ['/api/player'],
        sharedFormulas: true,
        sharedTypes: true,
        sharedValidation: true,
      },
    };
    const report = runMobileApiAudit(contracts, ['inventory', 'player_state']);
    expect(report.auditedSystems).toBe(2);
    expect(report.passedSystems).toBe(2);
    expect(report.passRate).toBe(1);
  });

  it('flags DOM-dependent systems', () => {
    const contracts: Partial<Record<MobileApiSystem, MobileApiContract>> = {
      combat: {
        system: 'combat',
        stateRetrievable: false,
        mutable: true,
        transports: [],
        requiresDom: true,
        endpoints: [],
        sharedFormulas: false,
        sharedTypes: false,
        sharedValidation: false,
      },
    };
    const report = runMobileApiAudit(contracts, ['combat']);
    expect(report.domDependentSystems).toBe(1);
    expect(report.blockedSystems).toContain('combat');
    expect(report.mobileReady).not.toContain('combat');
  });

  it('reports missing contracts', () => {
    const report = runMobileApiAudit({}, ['crafting']);
    expect(report.passedSystems).toBe(0);
    expect(report.blockedSystems).toContain('crafting');
    const rec = report.recommendations.find((r) => r.system === 'crafting');
    expect(rec).toBeDefined();
    expect(rec!.severity).toBe('critical');
  });

  it('adds recommendations for non-ready systems', () => {
    const report = runMobileApiAudit({
      npc: { ...mobileReadyContract, system: 'npc', requiresDom: true, endpoints: [] },
    }, ['npc']);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});

// ─── URL BUILDING ──────────────────────────────────────────────

describe('buildEndpointUrl', () => {
  it('builds simple url', () => {
    const url = buildEndpointUrl({ baseUrl: 'https://api.example.com', timeoutMs: 0, autoAuth: true, validateResponses: true, retries: 0 }, '/api/player');
    expect(url).toBe('https://api.example.com/api/player');
  });

  it('handles trailing slash on base', () => {
    const url = buildEndpointUrl({ baseUrl: 'https://api.example.com/', timeoutMs: 0, autoAuth: true, validateResponses: true, retries: 0 }, '/api/player');
    expect(url).toBe('https://api.example.com/api/player');
  });

  it('appends query params', () => {
    const url = buildEndpointUrl(
      { baseUrl: 'https://api.example.com', timeoutMs: 0, autoAuth: true, validateResponses: true, retries: 0 },
      '/api/items',
      { limit: 10, category: 'sword' },
    );
    expect(url).toContain('limit=10');
    expect(url).toContain('category=sword');
  });
});

// ─── RESPONSE VALIDATION ────────────────────────────────────────

describe('validateApiResponse', () => {
  it('passes valid response', () => {
    const failures = validateApiResponse({ playerId: 'p1', level: 5 }, 'playerId');
    expect(failures).toHaveLength(0);
  });

  it('fails missing field', () => {
    const failures = validateApiResponse({ level: 5 }, 'playerId');
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails null response', () => {
    const failures = validateApiResponse(null, 'playerId');
    expect(failures.length).toBeGreaterThan(0);
  });

  it('fails non-object', () => {
    const failures = validateApiResponse('nope', 'playerId');
    expect(failures.length).toBeGreaterThan(0);
  });
});

// ─── API DISPATCH ─────────────────────────────────────────────

describe('dispatchApiRequest', () => {
  const config = { baseUrl: 'https://api.example.com', timeoutMs: 1000, autoAuth: true, validateResponses: true, retries: 0 };

  it('returns success with data', async () => {
    const fetchFn = async () => ({ ok: true, status: 200, json: async () => ({ playerId: 'p1' }) });
    const result = await dispatchApiRequest(fetchFn, config, '/api/player', 'GET', undefined, 'playerId');
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect((result.data as { playerId: string }).playerId).toBe('p1');
  });

  it('returns error on HTTP failure', async () => {
    const fetchFn = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const result = await dispatchApiRequest(fetchFn, config, '/api/player', 'GET', undefined, 'playerId');
    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('returns error on validation failure', async () => {
    const fetchFn = async () => ({ ok: true, status: 200, json: async () => ({}) });
    const result = await dispatchApiRequest(fetchFn, config, '/api/player', 'GET', undefined, 'playerId');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation');
  });

  it('retries on failure', async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      if (calls < 2) throw new Error('network');
      return { ok: true, status: 200, json: async () => ({ playerId: 'p1' }) };
    };
    const result = await dispatchApiRequest(
      fetchFn,
      { ...config, retries: 2 },
      '/api/player', 'GET', undefined, 'playerId',
    );
    expect(result.success).toBe(true);
    expect(calls).toBeGreaterThan(1);
  });

  it('records duration', async () => {
    const fetchFn = async () => ({ ok: true, status: 200, json: async () => ({ playerId: 'p1' }) });
    const result = await dispatchApiRequest(fetchFn, config, '/api/player', 'GET', undefined, 'playerId');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

// ─── FEATURE AUDIT ─────────────────────────────────────────────

describe('auditMobileFeature', () => {
  it('passes feature with ready dependencies', () => {
    const audit = auditMobileFeature('inventory-screen', ['inventory', 'player_state'], ['inventory', 'player_state']);
    expect(audit.passed).toBe(true);
    expect(audit.domFree).toBe(true);
  });

  it('fails feature with missing dependency', () => {
    const audit = auditMobileFeature('combat-screen', ['combat'], ['inventory']);
    expect(audit.passed).toBe(false);
    expect(audit.failures).toContain('Dependency not mobile-ready: combat');
  });
});

// ─── SHARED LOGIC AUDIT ─────────────────────────────────────────

describe('auditSharedLogic', () => {
  it('categorizes shared logic', () => {
    const contracts: Partial<Record<MobileApiSystem, MobileApiContract>> = {
      inventory: { ...mobileReadyContract, system: 'inventory' },
      combat: {
        system: 'combat',
        stateRetrievable: false,
        mutable: true,
        transports: [],
        requiresDom: true,
        endpoints: [],
        sharedFormulas: true,
        sharedTypes: false,
        sharedValidation: false,
      },
    };
    const result = auditSharedLogic(['inventory', 'combat'], contracts);
    expect(result.sharedTypes).toContain('inventory');
    expect(result.sharedFormulas).toContain('combat');
    expect(result.sharedValidation).not.toContain('combat');
  });
});
