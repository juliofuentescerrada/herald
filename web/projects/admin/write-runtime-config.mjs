// Development: writes the admin's runtime configuration from the AppHost's HERALD_AUTH_* variables (D-1).
// The file is git-ignored; without the variables the app reports the missing configuration at start-up.
import { writeFileSync } from 'node:fs';

const config = {
  authority: process.env.HERALD_AUTH_AUTHORITY ?? '',
  clientId: process.env.HERALD_AUTH_CLIENT_ID ?? '',
  apiScope: process.env.HERALD_AUTH_API_SCOPE ?? '',
  publicUrl: process.env.HERALD_PUBLIC_URL ?? '',
  // Only for a provider that is not Microsoft's, such as the end-to-end suite's (ADR 0015).
  ...(process.env.HERALD_AUTH_PROTOCOL_MODE ? { protocolMode: process.env.HERALD_AUTH_PROTOCOL_MODE } : {}),
  ...(process.env.HERALD_AUTH_KNOWN_AUTHORITIES ? { knownAuthorities: process.env.HERALD_AUTH_KNOWN_AUTHORITIES.split(',') } : {}),
};
writeFileSync(new URL('./public/runtime-config.json', import.meta.url), `${JSON.stringify(config, null, 2)}\n`);
