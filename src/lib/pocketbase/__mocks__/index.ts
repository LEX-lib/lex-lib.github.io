import { vi } from 'vitest';

/**
 * Manual mock for @/lib/pocketbase.
 *
 * Shape requirements (from RESEARCH.md Pitfalls 2, 3, 6):
 *   - pb.collection(name) must return an object with all CRUD methods
 *   - pb.authStore must have onChange + clear + record (useAuthStore calls pb.authStore.onChange on init)
 *
 * Usage in test files:
 *   vi.mock('@/lib/pocketbase')           // Vitest hoists this; no import needed in tests
 *   const { pb } = await import('@/lib/pocketbase')  // get typed reference to mocked pb
 */

const collectionMethods = {
  getFullList: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  update: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  delete: vi.fn().mockResolvedValue(undefined),
};

export const pb = {
  collection: vi.fn().mockReturnValue(collectionMethods),
  authStore: {
    record: null,
    onChange: vi.fn(),
    clear: vi.fn(),
  },
};
