// Development only: `ng serve` forwards the apps' relative /api requests to the Herald host (W-05).
// Aspire sets HERALD_API_URL; without it, the host's own launch URL. Production routing is the ingress's (M4).
const target = process.env.HERALD_API_URL ?? 'http://localhost:5180';

export default { '/api': { target, changeOrigin: true } };
