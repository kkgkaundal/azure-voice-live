// Simple environment detection without global type dependencies
export const isBrowser = (() => {
  try {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  } catch {
    return false;
  }
})();

export const isNode = (() => {
  try {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
  } catch {
    return false;
  }
})();

export const isWebWorker = (() => {
  try {
    return typeof self !== 'undefined' && typeof (self as any).importScripts === 'function';
  } catch {
    return false;
  }
})();

export function getEnvironment(): 'browser' | 'node' | 'webworker' | 'unknown' {
  if (isBrowser) return 'browser';
  if (isNode) return 'node';
  if (isWebWorker) return 'webworker';
  return 'unknown';
}