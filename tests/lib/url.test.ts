import { describe, it, expect } from 'vitest';
import { href } from '../../src/lib/url';

describe('href', () => {
  it('joins base and path with exactly one slash, trailing slash preserved', () => {
    expect(href('/schools/oakridge/', '/funded/')).toBe('/funded/schools/oakridge/');
    expect(href('/schools/oakridge/', '/funded')).toBe('/funded/schools/oakridge/');
    expect(href('schools/oakridge/', '/funded/')).toBe('/funded/schools/oakridge/');
  });
  it('root path yields the base with a trailing slash', () => {
    expect(href('/', '/funded')).toBe('/funded/');
    expect(href('/', '/')).toBe('/');
  });
});
