import { describe, expect, it } from 'vitest';
import { parseStrictBoolean } from './parseBoolean';

describe('parseStrictBoolean', () => {
  it('respeta booleanos reales', () => {
    expect(parseStrictBoolean(true)).toBe(true);
    expect(parseStrictBoolean(false)).toBe(false);
  });

  it('interpreta strings "true"/"false" sin confundirlos con truthy', () => {
    expect(parseStrictBoolean('true')).toBe(true);
    expect(parseStrictBoolean('false')).toBe(false);
    expect(parseStrictBoolean(' TRUE ')).toBe(true);
    expect(parseStrictBoolean('False')).toBe(false);
  });

  it('interpreta 1/0 numéricos y string numéricos', () => {
    expect(parseStrictBoolean(1)).toBe(true);
    expect(parseStrictBoolean(0)).toBe(false);
    expect(parseStrictBoolean('1')).toBe(true);
    expect(parseStrictBoolean('0')).toBe(false);
  });

  it('devuelve undefined para valores no interpretables', () => {
    expect(parseStrictBoolean(undefined)).toBeUndefined();
    expect(parseStrictBoolean(null)).toBeUndefined();
    expect(parseStrictBoolean('')).toBeUndefined();
    expect(parseStrictBoolean('si')).toBeUndefined();
    expect(parseStrictBoolean(2)).toBeUndefined();
    expect(parseStrictBoolean({})).toBeUndefined();
  });
});
