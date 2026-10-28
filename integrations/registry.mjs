// Aureon connector registry: metadata and security policy only.
// This module never stores API keys or performs remote requests.
export const AUTH_TYPES = Object.freeze(['none','api_key','oauth2','service_account']);
const idPattern = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
export function validateProvider(provider) {
  if (!provider || typeof provider !== 'object' || Array.isArray(provider)) throw new TypeError('provider must be an object');
  const {id,name,homepage,authType,countries,capabilities} = provider;
  if (typeof id !== 'string' || !idPattern.test(id)) throw new TypeError('invalid provider id');
  if (typeof name !== 'string' || !name.trim()) throw new TypeError('invalid provider name');
  const u = new URL(homepage);
  if (u.protocol !== 'https:' || u.username || u.password) throw new TypeError('provider homepage must be https without credentials');
  if (!AUTH_TYPES.includes(authType)) throw new TypeError('invalid auth type');
  if (!Array.isArray(countries) || countries.length === 0 || !countries.every(v => v === 'GLOBAL' || /^[A-Z]{2}$/.test(v))) throw new TypeError('countries must use ISO 3166-1 alpha-2 or GLOBAL');
  if (!Array.isArray(capabilities) || capabilities.length === 0 || !capabilities.every(v => typeof v === 'string' && idPattern.test(v))) throw new TypeError('invalid capabilities');
  const allowed = new Set(['id','name','homepage','authType','countries','capabilities','documentation','status']);
  for (const key of Object.keys(provider)) {
    if (!allowed.has(key)) throw new TypeError('unsupported field '+key+'; do not embed secrets');
  }
  if (provider.documentation !== undefined) {
    const docs = new URL(provider.documentation);
    if (docs.protocol !== 'https:' || docs.username || docs.password) throw new TypeError('documentation must be https');
  }
  return Object.freeze({...provider,countries:Object.freeze([...new Set(countries)]),capabilities:Object.freeze([...new Set(capabilities)])});
}
export class ConnectorRegistry {
  #items = new Map();
  register(provider) {
    const entry = validateProvider(provider);
    if (this.#items.has(entry.id)) throw new Error('duplicate provider id: '+entry.id);
    this.#items.set(entry.id,entry);
    return entry;
  }
  find({country,capability,authType} = {}) {
    if (country !== undefined && !/^[A-Z]{2}$/.test(country)) throw new TypeError('invalid country');
    return [...this.#items.values()].filter(p =>
      (!country || p.countries.includes('GLOBAL') || p.countries.includes(country)) &&
      (!capability || p.capabilities.includes(capability)) &&
      (!authType || p.authType === authType)
    );
  }
  get(id) { return this.#items.get(id) ?? null; }
  list() { return [...this.#items.values()]; }
}
