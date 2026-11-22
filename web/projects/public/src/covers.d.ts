// A test's spec scenario marker, read by scripts/spec-coverage.mjs: it('…', { meta: { type: 'covers', description: '<capability>: <scenario>' } }, …).
declare module 'vitest' {
  interface TaskMeta {
    type?: 'covers';
    description?: string;
  }
}

export {};
