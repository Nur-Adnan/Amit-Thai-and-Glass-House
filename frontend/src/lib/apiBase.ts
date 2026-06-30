import config from './config'

/**
 * Single source of truth for the backend API base URL.
 * Resolves from NEXT_PUBLIC_API_URL (see lib/config.ts), falling back to
 * http://localhost:3001 for local dev. Use this instead of hardcoding the host.
 */
export const API_BASE = config.apiUrl
