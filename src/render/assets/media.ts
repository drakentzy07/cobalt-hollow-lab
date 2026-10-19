import { MEDIA_ASSETS } from './manifest.generated';

function logicalPath(url: string): string {
  return url.replace(/^\/+/, '');
}

export function assetUrl(url: string): string {
  const logical = logicalPath(url);
  const raw = import.meta.env.DEV ? `/${logical}` : (MEDIA_ASSETS[logical] ?? `/${logical}`);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base && raw.startsWith('/') && !raw.startsWith(`${base}/`) ? `${base}${raw}` : raw;
}
