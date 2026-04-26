import { ulid } from 'ulid';

export function newId(): string {
  return ulid();
}

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function isUlid(value: unknown): value is string {
  return typeof value === 'string' && ULID_RE.test(value);
}
