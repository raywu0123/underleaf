import { describe, it, expect } from 'vitest';
import { Hocuspocus } from '@hocuspocus/server';

describe('Hocuspocus Server', () => {
  it('initializes without throwing', () => {
    const server = new Hocuspocus({
      port: 0, // dynamic port for testing
    });
    expect(server).toBeDefined();
    // Don't listen to avoid open handle warnings
  });
});
