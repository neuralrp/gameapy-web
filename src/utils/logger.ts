/**
 * Logger utility for conditional console logging.
 *
 * In production (when VITE_API_BASE_URL contains 'vercel' or 'railway'),
 * logs are suppressed to avoid exposing debug information.
 */

const isProduction = (): boolean => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
  return apiUrl.includes('vercel') || apiUrl.includes('railway') || import.meta.env.PROD;
};

export const logger = {
  log: (...args: unknown[]) => {
    if (!isProduction()) {
      console.log(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (!isProduction()) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, but consider using error tracking service in production
    console.error(...args);
  },

  debug: (...args: unknown[]) => {
    if (!isProduction()) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (!isProduction()) {
      console.info(...args);
    }
  },
};

export default logger;
