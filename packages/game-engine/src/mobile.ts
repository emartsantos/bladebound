// ─── MOBILE API READINESS ENGINE ────────────────────────────────
// Phase 33: Audit every system for mobile API readiness. Confirm
// game state is obtainable via APIs without DOM logic. Share logic,
// not DOM.

import type {
  MobileApiSystem,
  MobileApiContract,
  MobileApiAuditItem,
  MobileApiAuditReport,
  MobileApiRecommendation,
  MobileApiContract as Contract,
  ApiEndpointDef,
  ApiClientConfig,
  ApiResult,
  MobileFeatureAudit,
} from '@premium-rpg/shared-types';

// ─── CONTRACT AUDIT ─────────────────────────────────────────────

export function auditSystemContract(
  system: MobileApiSystem,
  contract: MobileApiContract,
): MobileApiAuditItem {
  const failures: string[] = [];

  if (!contract.stateRetrievable) {
    failures.push('State is not retrievable via API');
  }
  if (contract.requiresDom) {
    failures.push('Requires DOM to obtain state');
  }
  if (contract.transports.length === 0) {
    failures.push('No transport mechanism defined');
  }
  if (contract.endpoints.length === 0) {
    failures.push('No endpoints exposed');
  }

  const passed = failures.length === 0 && !contract.requiresDom && contract.stateRetrievable;

  return {
    system,
    name: system.replace(/_/g, ' '),
    contract,
    returnSummary: contract.requiresDom
      ? 'DOM-dependent'
      : `State via ${contract.transports.join(', ')}`,
    passed,
    failures,
  };
}

// ─── FULL SYSTEM AUDIT ──────────────────────────────────────────

export function runMobileApiAudit(
  contracts: Partial<Record<MobileApiSystem, MobileApiContract>>,
  allSystems?: MobileApiSystem[],
): MobileApiAuditReport {
  const systems = allSystems ?? (Object.keys(contracts) as MobileApiSystem[]);
  const items: MobileApiAuditItem[] = [];
  const recommendations: MobileApiRecommendation[] = [];

  for (const system of systems) {
    const contract = contracts[system];
    if (!contract) {
      items.push({
        system,
        name: system.replace(/_/g, ' '),
        contract: {
          system,
          stateRetrievable: false,
          mutable: false,
          transports: [],
          requiresDom: true,
          endpoints: [],
          sharedFormulas: false,
          sharedTypes: false,
          sharedValidation: false,
        },
        returnSummary: 'Missing contract',
        passed: false,
        failures: ['No contract defined — state not accessible via API'],
      });
      recommendations.push({
        system,
        severity: 'critical',
        title: `${system} has no API contract`,
        description: 'The mobile app cannot obtain state for this system via API',
        remediation: 'Define a rest/ws endpoint that returns serializable state',
      });
      continue;
    }

    const item = auditSystemContract(system, contract);
    items.push(item);

    if (!item.passed) {
      recommendations.push({
        system,
        severity: item.contract.requiresDom ? 'critical' : 'warning',
        title: `${item.name} is not mobile-ready`,
        description: item.failures.join('; '),
        remediation: item.contract.requiresDom
          ? 'Refactor to expose state via API; do not couple to DOM'
          : 'Expose state endpoints and share types/formulas/validation',
      });
    }
  }

  const passedSystems = items.filter((i) => i.passed).length;
  const domDependentSystems = items.filter((i) => i.contract.requiresDom).length;
  const auditedSystems = items.length;
  const passRate = auditedSystems > 0 ? passedSystems / auditedSystems : 0;

  return {
    generatedAt: Date.now(),
    auditedSystems,
    passedSystems,
    domDependentSystems,
    passRate,
    items,
    mobileReady: items.filter((i) => i.passed).map((i) => i.system),
    blockedSystems: items.filter((i) => !i.passed).map((i) => i.system),
    recommendations,
  };
}

// ─── API CLIENT ─────────────────────────────────────────────────

const DEFAULT_CLIENT_CONFIG: Required<Omit<ApiClientConfig, 'baseUrl'>> = {
  timeoutMs: 10000,
  autoAuth: true,
  validateResponses: true,
  retries: 2,
};

/**
 * Build URL for an endpoint.
 */
export function buildEndpointUrl(
  config: ApiClientConfig,
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = `${config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (params) {
    const keyValues = Object.entries(params).map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    );
    if (keyValues.length > 0) url += `?${keyValues.join('&')}`;
  }
  return url;
}

/**
 * Validate that a response payload matches expected shape.
 * Returns failures (empty = valid).
 */
export function validateApiResponse<T>(
  data: unknown,
  requiredField: keyof T & string,
): string[] {
  if (data === null || data === undefined) return ['Response is null/undefined'];
  if (typeof data !== 'object') return ['Response is not an object'];
  const obj = data as Record<string, unknown>;
  if (obj[requiredField as string] === undefined) {
    return [`Missing required field: ${String(requiredField)}`];
  }
  return [];
}

/**
 * A mock/dispatchable API request. Since the engine is framework-
 * independent and runs in Node, this returns a structured result
 * without making a real network call. Real transport is injected.
 */
export async function dispatchApiRequest<T>(
  fetchFn: (url: string, init: unknown) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>,
  config: ApiClientConfig,
  path: string,
  method: string,
  body?: unknown,
  requiredResponseField?: keyof T & string,
): Promise<ApiResult<T>> {
  const started = Date.now();
  const timeout = config.timeoutMs ?? DEFAULT_CLIENT_CONFIG.timeoutMs;
  const retries = config.retries ?? DEFAULT_CLIENT_CONFIG.retries;
  const url = buildEndpointUrl(config, path);

  let lastError: string | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const init: Record<string, unknown> = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body !== undefined) init.body = JSON.stringify(body);

      const res = await fetchFn(url, init);
      const data = await res.json();

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      if (config.validateResponses && requiredResponseField) {
        const failures = validateApiResponse<T>(data, requiredResponseField);
        if (failures.length > 0) {
          return {
            success: false,
            status: res.status,
            error: `Validation: ${failures.join(', ')}`,
            durationMs: Date.now() - started,
          };
        }
      }

      return {
        success: true,
        status: res.status,
        data: data as T,
        durationMs: Date.now() - started,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    success: false,
    error: lastError ?? 'Request failed',
    durationMs: Date.now() - started,
  };
}

// ─── FEATURE AUDIT ──────────────────────────────────────────────

export function auditMobileFeature(
  feature: string,
  dependsOn: MobileApiSystem[],
  readySystems: MobileApiSystem[],
): MobileFeatureAudit {
  const missing = dependsOn.filter((d) => !readySystems.includes(d));
  const dependenciesReady = missing.length === 0;

  return {
    feature,
    domFree: true, // features using API state are DOM-free by construction
    dependsOn,
    dependenciesReady,
    passed: dependenciesReady,
    failures: missing.map((m) => `Dependency not mobile-ready: ${m}`),
  };
}

// ─── SHARED LOGIC AUDIT ─────────────────────────────────────────

export function auditSharedLogic(
  systems: MobileApiSystem[],
  contracts: Partial<Record<MobileApiSystem, MobileApiContract>>,
): { sharedTypes: MobileApiSystem[]; sharedFormulas: MobileApiSystem[]; sharedValidation: MobileApiSystem[] } {
  const sharedTypes: MobileApiSystem[] = [];
  const sharedFormulas: MobileApiSystem[] = [];
  const sharedValidation: MobileApiSystem[] = [];

  for (const system of systems) {
    const c = contracts[system];
    if (!c) continue;
    if (c.sharedTypes) sharedTypes.push(system);
    if (c.sharedFormulas) sharedFormulas.push(system);
    if (c.sharedValidation) sharedValidation.push(system);
  }

  return { sharedTypes, sharedFormulas, sharedValidation };
}
