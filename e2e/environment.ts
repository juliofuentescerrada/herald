// Fixed ports from a reserved range, clear of a developer's Aspire run (4200, 4300, 5180) (design E-5).
export const ports = { database: 5480, provider: 5481, host: 5482, admin: 5483, public: 5484 } as const;

// mock-oauth2-server writes its issuer id into `tid`, so the issuer id is a tenant identifier, as in External ID.
export const tenantId = '0e2e0000-0000-4000-8000-00000000e2e0';
export const authority = `https://localhost:${ports.provider}/${tenantId}`;
export const audience = 'api://herald-e2e';
export const apiScope = `${audience}/access`;
export const adminClientId = 'herald-admin-e2e';

export const databasePassword = 'herald-e2e';
export const databaseConnectionString =
  `Host=localhost;Port=${ports.database};Database=herald;Username=postgres;Password=${databasePassword}`;

export const urls = {
  host: `http://localhost:${ports.host}`,
  admin: `http://localhost:${ports.admin}`,
  public: `http://localhost:${ports.public}`,
} as const;
